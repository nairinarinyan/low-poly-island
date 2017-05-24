attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_mvp;
uniform mat3 u_normal_mat;

uniform vec3 u_ambient_color;
uniform vec3 u_diffuse_color;
uniform vec3 u_light_position;

varying vec3 v_light;

void main()
{
    vec4 vertex_position = u_mvp * vec4(a_position, 1.0);
    vec3 vertex_position_eye = vertex_position.xyz / vertex_position.w;

    vec3 vertex_to_light = normalize(u_light_position - vertex_position_eye);

    vec3 normal_eye = normalize(u_normal_mat * a_normal);

    float diffuse_light = max(dot(normal_eye, vertex_to_light), 0.0);

    v_light = u_ambient_color + u_diffuse_color * diffuse_light;
    
    gl_Position = u_mvp * vec4(a_position, 1.0);
}