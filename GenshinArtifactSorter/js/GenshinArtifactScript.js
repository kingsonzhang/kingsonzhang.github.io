//Keep a record of the current artifact set selected
let current = "";
const HOVERBACKGROUNDCOLOR = "rgba(50, 50, 50, .5)";
const NEUTRALBACKGROUNDCOLOR = "rgba(50, 50, 50, 0)";
const SELECTEDBACKGROUNDCOLOR = "rgba(50, 50, 50, 1)";

//Add an EventListener for hover on artifact set name
//Highlight background to let the user know which artifact set is currently hovered
document.querySelectorAll(".ArtifactSet").forEach(x => x.addEventListener("mouseover", function onHover(event){
    event.target.style.backgroundColor = HOVERBACKGROUNDCOLOR;
}));

//Add an EventListner for mouse exit on artifact set name
//Un-highlight background to the let the user know which artifact set was just left
//Depending on if the artifact set hovered was selected or not
//Change the state to previous
document.querySelectorAll(".ArtifactSet").forEach(x => x.addEventListener("mouseout", function exitHover(event){
    if (event.target.id != current)
        event.target.style.backgroundColor = NEUTRALBACKGROUNDCOLOR;
    else
    event.target.style.backgroundColor = SELECTEDBACKGROUNDCOLOR;
}));

//On click, select the artifact set
//Changing background color to selected
//Changing artifact set text to white color
//Revert previous artifact set collected to neutral state
//Display the pieces of the artifact set selected
document.querySelectorAll(".ArtifactSet").forEach(x => x.addEventListener("click", function onClick(event){
    if (current != ""){
        let previousSelected = document.getElementById(current);
        previousSelected.style.backgroundColor = NEUTRALBACKGROUNDCOLOR;
        previousSelected.style.color = "black";
    }
    current = event.target.id;

    let currentlySelected = document.getElementById(current);
    currentlySelected.style.backgroundColor = SELECTEDBACKGROUNDCOLOR;
    currentlySelected.style.color = "white";

    changeArtifacts(current);
}));

//Loop through each type of artifact pieces and get their img
//Update the cooresponding img srcs
function changeArtifacts(eventId){
    const PIECES = ["Flower", "Feather", "Timepiece", "Goblet", "Circlet"];
    PIECES.forEach(x =>{
        document.getElementById(x).src = `./images/${eventId}/${eventId}${x}.jpg`;
    });
}