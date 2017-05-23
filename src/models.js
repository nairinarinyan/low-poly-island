import { loadResource } from './utils';

export function importModel(modelName) {
    return loadResource('./models/' + modelName + '.json')
        .catch(console.error);
}