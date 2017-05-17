import { loadResource } from './utils';

export function importModel(modelName) {
    return loadResource('./models/' + modelName + '.json')
        .then(meshData => {
            return meshData.data;
        })
        .catch(console.error);
}