attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_mv;
uniform mat4 u_p;
uniform mat3 u_normal_mat;

uniform vec3 u_mat_color_a;
uniform vec3 u_mat_color_d;

uniform float u_ka;
uniform float u_kd;

uniform float u_ia;
uniform float u_id;

uniform vec3 u_light_position;

varying vec3 v_color;
varying vec3 v_normal;

void main()
{
    vec4 vertex_position = u_mv * vec4(a_position, 1.0);
    vec3 vertex_position_eye = vertex_position.xyz / vertex_position.w;

    vec3 vertex_to_light = normalize(u_light_position - vertex_position_eye);
    vec3 normal_eye = normalize(u_normal_mat * a_normal);

    vec3 ambient = u_ka * u_ia * u_mat_color_a;
    vec3 diffuse = u_kd * max(dot(normal_eye, vertex_to_light), 0.0) * u_id * u_mat_color_d;

    vec3 reflection_vec = normalize(reflect(-vertex_to_light, normal_eye));
    vec3 view_vector_eye = -normalize(vertex_position_eye);

    float rdotv = max(dot(view_vector_eye, reflection_vec), 0.0);
    float specular = pow(rdotv, 32.0);

    v_color = ambient + diffuse + specular;
    v_normal = normal_eye;

    gl_Position = u_p * u_mv * vec4(a_position, 1.0);
}