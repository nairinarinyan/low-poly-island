precision mediump float;

uniform vec3 u_mat_color_a;
uniform vec3 u_mat_color_d;

uniform float u_ka;
uniform float u_kd;
uniform float u_ks;

uniform float u_ia;
uniform float u_id;
uniform float u_shininess;

uniform vec3 u_light_position;

varying vec3 v_position;
varying vec3 v_normal;

void main()
{
    vec3 light_dir = normalize(u_light_position - v_position);
    vec3 norm = normalize(v_normal);

    // ambient
    vec3 ambient = u_ka * u_ia * u_mat_color_a;

    // diffuse
    float diff = max(dot(norm, light_dir), 0.0);
    vec3 diffuse = u_kd * diff * u_id * u_mat_color_d;

    vec3 reflection_dir = normalize(reflect(-light_dir, norm));
    vec3 view_dir = -normalize(v_position);

    float rdotv = max(dot(view_dir, reflection_dir), 0.0);
    float specular = u_ks * pow(rdotv, u_shininess);

    vec3 color = ambient + diffuse + specular;
    gl_FragColor = vec4(color, 1);
}