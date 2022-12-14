/*
 * @Author: junwei.gu junwei.gu@jiduauto.com
 * @Date: 2022-10-19 14:29:24
 * @LastEditors: junwei.gu junwei.gu@jiduauto.com
 * @LastEditTime: 2023-01-10 18:35:57
 * @FilePath: \GEngine\src\mesh\Mesh.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { FrameState } from "../core/FrameState";
import Intersect from "../core/Intersect";
import RenderObject from "../core/RenderObject";
import Geometry from "../geometry/Geometry";
import { Material } from "../material/Material";
import DrawCommand from "../render/DrawCommand";
export class Mesh extends RenderObject {
    [x: string]: any;
    geometry?: Geometry;
    material?: Material;
    instances?: number;
    priority?:number;
    drawCommand?: DrawCommand;
    distanceToCamera?:number;
    constructor(geometry?:Geometry, material?: Material) {
        super();
        this.geometry = geometry;
        this.material = material;
        this.type = 'primitive';
    }
    update(frameState: FrameState) {
        //update matrix
        this.updateMatrix();

        this.updateNormalMatrix(frameState.camera)
        //create 
        this.geometry.update(frameState);

        this.material.update(frameState,this);

        // update boundingSphere

        this.geometry.boundingSphere.update(this.modelMatrix);

        this.distanceToCamera=this.geometry.boundingSphere.distanceToCamera(frameState);

        const visibility = frameState.cullingVolume.computeVisibility(this.geometry.boundingSphere);
        //视锥剔除
        if (visibility === Intersect.INTERSECTING||visibility===Intersect.INSIDE) {
            if (this.material.transparent) {
                frameState.renderQueue.transparent.push(this)
            } else {
                frameState.renderQueue.opaque.push(this)
            }
        }
        
    }
    beforeRender(){
        console.log('before');
        
    }
    afterRender(){
        console.log('after');
    }
    public getDrawCommand(){
        if (!this.drawCommand||this.material.dirty) {
            if (this.material.dirty) this.material.dirty=false;
            this.drawCommand= new DrawCommand({
                vertexBuffers: this.geometry.vertexBuffers,
                indexBuffer: this.geometry.indexBuffer,
                indexFormat: this.geometry.stripIndexFormat,
                shaderData:this.material.shaderData,
                instances: this.instances,
                count: this.geometry.count,
                renderState:this.material.renderState,
                topology:this.geometry.topology as GPUPrimitiveTopology,
                shaderSource:this.material.shaderSource,
                type:'render',
                onwer:this,
                materialType:this.material.type       
            });
            return this.drawCommand;
        } else {
          return this.drawCommand;
        }
    }
    destroy() {
        this.geometry.destroy();
        this.material.destroy();
    }
}
