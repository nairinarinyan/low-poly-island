attribute vec3 a_vertex_position;

void main()
{
    gl_Position = vec4(a_vertex_position, 1.0);
}