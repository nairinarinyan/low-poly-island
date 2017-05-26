import { matMul } from './math';

const Scene = {
    camera: null,
    light: null,
    models: [],

    addModel(model, parent = null) {
        const parentModel = this.models.find(model => model === parent);

        if (parentModel) {
            model.transform = matMul(parentModel.transform, model.transform);
            parentModel.children.push(model);
            model.parent = parentModel;
        } else {
            this.models.push(model);
        }
    }
};

export default Scene;
