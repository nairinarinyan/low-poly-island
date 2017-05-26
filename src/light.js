export default class Light {
    constructor(options) {
        const { position, ambientIntensity, diffuseIntensity, specularIntensity } = options;

        this.position = new Float32Array(position);
        this.ambientIntensity = ambientIntensity;
        this.diffuseIntensity = diffuseIntensity;
        this.specularIntensity = specularIntensity;
    }
}