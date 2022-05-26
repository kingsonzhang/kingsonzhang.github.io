let current = "";

document.querySelectorAll(".ArtifactSet").forEach(x => x.addEventListener("mouseover", function onHover(event){
    event.target.style.backgroundColor = "rgba(50, 50, 50, .5)";
}));

document.querySelectorAll(".ArtifactSet").forEach(x => x.addEventListener("mouseout", function exitHover(event){
    if (event.target.id != current)
        event.target.style.backgroundColor = "rgba(50, 50, 50, 0)";
}));

document.querySelectorAll(".ArtifactSet").forEach(x => x.addEventListener("click", function onClick(event){
    if (current != ""){
        let previousSelected = document.getElementById(current);
        previousSelected.style.backgroundColor = "rgba(50, 50, 50, 0)";
        previousSelected.style.color = "black";
    }
    current = event.target.id;

    let currentlySelected = document.getElementById(current);
    currentlySelected.style.backgroundColor = "rgba(50, 50, 50, 1)";
    currentlySelected.style.color = "white";
}))