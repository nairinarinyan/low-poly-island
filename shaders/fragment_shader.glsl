precision mediump float;

varying vec3 v_light;

void main()
{
    gl_FragColor = vec4(v_light.rgb * vec3(.2, .4, .7), 1);
}