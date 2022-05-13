setInterval(changeColor, 500);

function changeColor(){
    const RED = Math.floor(Math.random() * 255);
    const GREEN = Math.floor(Math.random() * 255);
    const BLUE = Math.floor(Math.random() * 255);
    document.querySelector("body").style.backgroundColor = `rgb(${RED}, ${GREEN}, ${BLUE})`;

    if ((RED + GREEN + BLUE) / 3 < (255 / 2)){
        document.querySelector("h1").style.color = "white";
        document.querySelector("p").style.color = "white";
    }
    else{
        document.querySelector("h1").style.color = "black";
        document.querySelector("p").style.color = "black";
    }
}
