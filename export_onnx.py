import os
import json
import torch
import torch.nn as nn
import open_clip
import onnx
from onnx.external_data_helper import convert_model_from_external_data
from onnxruntime.quantization import quantize_dynamic, QuantType

MODEL_NAME = 'hf-hub:microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224'

CONDITIONS = {
    "reddening": {
        "clinical_term": "Erythema / Inflammation",
        "positive": "skin with erythema or rash",
        "negative": "normal skin",
        "threshold": 50.0
    },
    "dryness": {
        "clinical_term": "Xerosis / Dryness",
        "positive": "skin with xerosis, scaling, or desquamation",
        "negative": "normal skin",
        "threshold": 50.0
    },
    "breakage": {
        "clinical_term": "Skin Barrier Rupture",
        "positive": "broken skin with fissures or erosion",
        "negative": "normal intact skin",
        "threshold": 50.0
    }
}

class VisionEncoderWrapper(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x):
        features = self.model.encode_image(x)
        features = features / features.norm(dim=-1, keepdim=True)
        return features

def export():
    print("Loading BiomedCLIP model...")
    model, _, _ = open_clip.create_model_and_transforms(MODEL_NAME)
    tokenizer = open_clip.get_tokenizer(MODEL_NAME)
    model.eval()

    # 1. Pre-compute static text embeddings
    print("Pre-computing text embeddings...")
    embeddings_data = {}
    with torch.no_grad():
        for key, cond in CONDITIONS.items():
            prompts = [cond["positive"], cond["negative"]]
            tokens = tokenizer(prompts)
            tf = model.encode_text(tokens)
            tf /= tf.norm(dim=-1, keepdim=True)
            embeddings_data[key] = {
                "clinical_term": cond["clinical_term"],
                "positive_vec": tf[0].tolist(),
                "negative_vec": tf[1].tolist(),
                "threshold": cond["threshold"]
            }

    with open("text_embeddings.json", "w") as f:
        json.dump(embeddings_data, f, indent=2)
    print("Saved text_embeddings.json")

    # 2. Export FP32 Vision Encoder to intermediate file
    temp_fp32_path = "vision_fp32.onnx"
    print("Exporting FP32 vision model to ONNX...")
    wrapper = VisionEncoderWrapper(model)
    wrapper.eval()
    dummy_input = torch.randn(1, 3, 224, 224)

    torch.onnx.export(
        wrapper,
        dummy_input,
        temp_fp32_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        dynamo=False
    )

    # Consolidate external weight files into the intermediate ONNX model
    onnx_model = onnx.load(temp_fp32_path)
    convert_model_from_external_data(onnx_model)
    onnx.save(onnx_model, temp_fp32_path)
    if os.path.exists(f"{temp_fp32_path}.data"):
        os.remove(f"{temp_fp32_path}.data")

    # 3. Apply Dynamic INT8 Quantization (~350 MB -> ~85 MB)
    final_onnx_path = "vision.onnx"
    print("Quantizing model to INT8 (~85 MB target)...")
    quantize_dynamic(
        model_input=temp_fp32_path,
        model_output=final_onnx_path,
        weight_type=QuantType.QUInt8
    )

    # Clean up temporary FP32 export model
    if os.path.exists(temp_fp32_path):
        os.remove(temp_fp32_path)

    size_mb = os.path.getsize(final_onnx_path) / (1024 * 1024)
    print(f"Successfully saved INT8 quantized model to {final_onnx_path} ({size_mb:.2f} MB)!")

if __name__ == "__main__":
    export()