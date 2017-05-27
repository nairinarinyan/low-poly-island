attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_mv;
uniform mat4 u_p;
uniform mat3 u_normal_mat;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_position;

void main()
{
    vec4 vertex_position = u_mv * vec4(a_position, 1.0);
    vec3 vertex_position_eye = vertex_position.xyz / vertex_position.w;

    vec3 normal_eye = normalize(u_normal_mat * a_normal);

    v_position = vertex_position_eye;
    v_normal = normal_eye;

    gl_Position = u_p * u_mv * vec4(a_position, 1.0);
}