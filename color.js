const hex = process.argv[2].replace(/#/, '');
const rgb = [];

for(let i = 0; i < 6; i+=2) {
    rgb.push(parseInt(hex.slice(i, i+2), 16) / 255);
}

console.log(rgb);
