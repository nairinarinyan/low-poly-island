export function loadResource(url, type) {
    return fetch(url)
        .then(res => res[type || 'json']());
}

export function importFile(fileName) {
    return loadResource('./models/' + fileName + '.json')
        .catch(console.error);
}

export function clampColor(hexColor) {
    const hex = hexColor.replace(/#/, '');
    const rgb = [];

    for(let i = 0; i < 6; i+=2) {
        rgb.push(parseInt(hex.slice(i, i+2), 16) / 255);
    }
    
    return rgb;
}

export function traverseTree(tree) {
    const subtree = Object.assign({}, tree);
    let childList = [];

    const traverse = subtree => {
        const { children } = subtree;

        delete subtree.children;
        childList.push(subtree);

        return children && children.forEach(traverse); 
    };

    traverse(subtree);

    return childList;
}

