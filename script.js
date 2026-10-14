// Regex to match GHS Hazard codes (e.g., H225, H301, H315)
const H_CODE_PATTERN = /\bH\d{3}[Ddfi]*\b/;

/**
 * Resolve chemical name to PubChem Compound ID (CID).
 * @param {string} name 
 * @returns {Promise<number|null>}
 */
async function getCidFromName(name) {
    const encodedName = encodeURIComponent(name);
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodedName}/cids/JSON`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        return data?.IdentifierList?.CID?.[0] ?? null;
    } catch (error) {
        console.error("Error fetching CID:", error);
        return null;
    }
}

/**
 * Extract GHS Hazard Statements from PUG View JSON response.
 * @param {Object} data 
 * @returns {string[]}
 */
function extractGhsHazardStatements(data) {
    const statements = new Set();

    function traverse(node) {
        if (node && typeof node === "object" && !Array.isArray(node)) {
            // Target node where Name is "GHS Hazard Statements" or "Hazard Statements"
            const nodeName = node.Name || "";
            if (nodeName === "GHS Hazard Statements" || nodeName === "Hazard Statements") {
                const val = node.Value || {};
                const markupItems = val.StringWithMarkup || [];
                for (const item of markupItems) {
                    if (item.String) {
                        statements.add(item.String);
                    }
                }
            }
            // Fallback check for string items containing H-code syntax
            else if (typeof node.String === "string") {
                const text = node.String;
                if (H_CODE_PATTERN.test(text) && text.includes(":")) {
                    statements.add(text);
                }
            }

            // Traverse deeper into dictionary values
            for (const key in node) {
                if (Object.prototype.hasOwnProperty.call(node, key)) {
                    traverse(node[key]);
                }
            }
        } else if (Array.isArray(node)) {
            for (const item of node) {
                traverse(item);
            }
        }
    }

    traverse(data);
    return Array.from(statements).sort();
}

/**
 * Fetch GHS classification section from PUG View API.
 * @param {number} cid 
 * @returns {Promise<string[]>}
 */
async function getGhsData(cid) {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`;

    try {
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        return extractGhsHazardStatements(data);
    } catch (error) {
        console.error("Error fetching GHS data:", error);
        return [];
    }
}

/**
 * Main handle function triggered when user submits a compound search.
 */
async function handleSearch() {
    const inputField = document.getElementById("chemicalInput");
    const outputDiv = document.getElementById("output");
    const compoundName = inputField.value.trim();

    if (!compoundName) {
        outputDiv.innerHTML = `<p class="error-text">Please enter a compound name.</p>`;
        return;
    }

    // UI Loading state
    outputDiv.innerHTML = `<p class="placeholder-text">Searching PubChem CID for "<strong>${escapeHtml(compoundName)}</strong>"...</p>`;

    const cid = await getCidFromName(compoundName);

    if (!cid) {
        outputDiv.innerHTML = `<p class="error-text">Error: Compound "<strong>${escapeHtml(compoundName)}</strong>" was not found on PubChem.</p>`;
        return;
    }

    outputDiv.innerHTML = `<p class="placeholder-text">Found CID: <strong>${cid}</strong>. Querying GHS Hazard Statements...</p>`;

    const hazardStatements = await getGhsData(cid);

    // Display Results
    if (hazardStatements.length > 0) {
        const listItems = hazardStatements
            .map(stmt => `<li>${escapeHtml(stmt)}</li>`)
            .join("");

        outputDiv.innerHTML = `
            <p class="cid-info">Results for ${escapeHtml(compoundName)} (CID: ${cid}):</p>
            <ul class="hazard-list">
                ${listItems}
            </ul>
        `;
    } else {
        outputDiv.innerHTML = `<p class="placeholder-text">No GHS Hazard Statements found on PubChem for this compound (CID: ${cid}).</p>`;
    }
}

/**
 * Helper to prevent XSS when inserting dynamic text.
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
document.getElementById("searchBtn").addEventListener("click", handleSearch);

document.getElementById("chemicalInput").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});