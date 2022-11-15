import BindGroup from "../render/BindGroup";
import  BindGroupEntity  from "../render/BindGroupEntity";
import  BindGroupLayout  from "../render/BindGroupLayout";
import BindGroupLayoutEntry from "../render/BindGroupLayoutEntry";
import Color from '../math/Color'
import RenderState from "../render/RenderState";
import Sampler from "../render/Sampler";
import Texture from "../render/Texture";
import DataBuffer from "../utils/DataBuffer";
import Buffer from "../render/Buffer";
import { ShaderSource } from "../shader/ShaderSource";
import combine from "../utils/combine";
import defaultValue from "../utils/defaultValue";
import { FrameState } from "../core/FrameState";
import Vector4 from "../math/Vector4";
import { BlendConstant, DepthStencil, MultiSample, PrimitiveState, Target } from "../core/WebGPUTypes";
import RenderObject from "../core/RenderObject";
export class Material{
    public uniformBuffer:Buffer;
    color?: Vector4;

    uniforms:any[];

    renderState:{};

    baseSampler?: Sampler;

    baseTexture?: Texture;

    alpha?: number;

    uniformsDataBuffer: Float32Array;

    type: string;

    label: string;

    shaderSource: ShaderSource;

    groupLayouts: BindGroupLayout[];

    bindGroups: BindGroup[];

    transparent:boolean;

    renderStateDirty:boolean;

    dirty:boolean;

    _blendConstant:BlendConstant;

    _targets:Target;

    _multisample:MultiSample;
    
    _primitiveState:PrimitiveState

    _stencilReference:number;

    _depthStencil:DepthStencil;

    _defines:{};

    definesDirty: boolean;

    constructor(){
        //
        this.label=undefined;
        this.type=undefined;
        this.baseTexture=undefined;
        this.baseSampler=undefined;
        this.renderState=undefined;
        this.color=undefined;
        this.alpha=undefined;
        //Buffer
        this.uniformBuffer=undefined;
        this.uniformsDataBuffer=undefined;
        this.uniforms=undefined;
        this.shaderSource=undefined;
        this.renderStateDirty=true;
        this.definesDirty=true;
        this._defines={};
        this.groupLayouts=[];
        this.bindGroups=[];
        this.dirty=true;
    }
    get defines(){
        return this._defines;
    }
    set defines(value){
        this.definesDirty=true;
        this._defines=combine(value,this._defines,false);
    }
    get blendConstant(){
        return this._blendConstant;
    }
    set blendConstant(value){
        this.renderStateDirty=true;
        this._blendConstant=combine(value,this._blendConstant,false) as BlendConstant;
    }
    get targets(){
        return this._targets;
    }
    set targets(value:Target){
        this.renderStateDirty=true;
        this._targets=combine(value,this._targets,false) as Target;
    }
    get multisample(){
        return this._multisample;
    }
    set multisample(value){
        this.renderStateDirty=true;
        this._multisample=combine(value,this._multisample,false);
    }
    get primitiveState(){
        return this._primitiveState;
    }
    set primitiveState(value){
        this.renderStateDirty=true;
        this._primitiveState=combine(value,this._primitiveState,false);
    }
    get stencilReference(){
        return this._stencilReference;
    }
    set stencilReference(value){
        this.renderStateDirty=true;
        this._stencilReference=value;
    }
    get depthStencil(){
        return this._depthStencil;
    }
    set depthStencil(value:DepthStencil){
        this.renderStateDirty=true;
        this._depthStencil=combine(value,this._depthStencil,false) as DepthStencil;
    }
    onBeforeRender() {}

	onBeforeCompile() {}

    update(frameState:FrameState,primitive:RenderObject){
       
    }
    updateUniform(){
        this.uniforms.forEach((uniform)=>{
            uniform.set();
        });
        this.uniformBuffer.setSubData(0,this.uniformsDataBuffer);

    }
    createRenderState(frameState:FrameState){
        let  depthStencil,primitive,multisample,stencilReference,targets,viewport,blendConstant;
        depthStencil=defaultValue(this.depthStencil,RenderState.defaultDepthStencil);
        primitive=defaultValue(this.primitiveState,RenderState.defaultPrimitiveState);
        multisample=defaultValue(this.multisample,RenderState.defaultMultisample);
        stencilReference=defaultValue(this.stencilReference,0);
        blendConstant=defaultValue(this.blendConstant,RenderState.defaultBlendConstant);
        viewport=frameState.viewport; 
        targets=frameState?.pass?.colorTargets!=undefined?frameState.pass.colorTargets:[RenderState.defaultTarget]
        this.renderState={depthStencil,primitive,multisample,stencilReference,targets,viewport,blendConstant}
    }
    static createBindGroupAndLayout(device:GPUDevice,uniforms:any[],uniformBuffer:Buffer,label:string,index:number){
        const layoutEntities=Material.createBindGroupLayoutEntry(uniforms,uniformBuffer);
        const groupLayout= BindGroupLayout.getBindGroupFromCache(device,label,layoutEntities,index);
        const groupEntities=Material.createBindGroupEntity(uniforms,uniformBuffer);
        const bindGroup=BindGroup.getBindGroupFromCache({
            label:label,
            entires:groupEntities,
            device:device,
            layout:groupLayout,
            index:index
           });
       return {groupLayout,bindGroup}
    }
    static createBindGroupLayoutEntry(uniforms,uniformBuffer){
        const result=new Map()
        uniforms.forEach((uniform)=>{
          if(!result.has(uniform.binding)){
               result.set(uniform.binding,Material.createOneLayoutEntry(uniform,uniformBuffer))
          }
        })
        const lauoutEntityArray=[]
        result.forEach((value)=>{
            lauoutEntityArray.push(value)
        })
    
       return lauoutEntityArray;
    }
    static createBindGroupEntity(uniforms,uniformBuffer) {
        const result=new Map()
        uniforms.forEach((uniform)=>{
          if(!result.has(uniform.binding)){
               result.set(uniform.binding,Material.creayeOneGroupEntity(uniform,uniformBuffer,uniforms))
          }
        })
        const groupEntityArray=[]
        result.forEach((value)=>{
            groupEntityArray.push(value)
        })
    
       return groupEntityArray;
    }
    static createOneLayoutEntry(uniform,uniformBuffer){
        let layoutEntity;
        if(uniform.type==='number'){
            layoutEntity= new BindGroupLayoutEntry({
                binding: uniform.binding,
                buffer:uniform?.buffer?.layoutType||uniformBuffer.layoutType,
                visibility: uniform.visibility,
                // uniforms: this.uniforms,
            });
        } else if(uniform.type==='texture'){
            layoutEntity = new BindGroupLayoutEntry({
                binding: uniform.binding,
                visibility: uniform.visibility,
                texture:uniform.value.layoutType
            });
        } else if(uniform.type==='sampler'){
            layoutEntity= new BindGroupLayoutEntry({
                binding: uniform.binding,
                visibility: uniform.visibility,
                sampler: {
                    type:uniform.value.layoutType,
                }
            });
        }
       return layoutEntity;
    }
    static creayeOneGroupEntity(uniform,uniformBuffer,uniforms){
        let groupEntity;
        if(uniform.type==='number'){
            groupEntity=new BindGroupEntity({
                binding:uniform.binding,
                resource:{
                    buffer:uniform?.buffer?.gpuBuffer||uniformBuffer.gpuBuffer,
                    offset: 0,
                    //兼容灯光
                    size:uniform.bufferSize!=undefined?uniform.bufferSize:Material.getBindingSize(uniforms)
                }
              });
        } else if(uniform.type==='texture'){
            groupEntity = new BindGroupEntity({
                binding:uniform.binding,
                resource:uniform.value.gpuTexture.createView()
            });
        } else if(uniform.type==='sampler'){
            groupEntity= new BindGroupEntity({
                binding:uniform.binding,
                resource:uniform.value.gpuSampler
            });
        }
       return groupEntity;
    }
    static getBindingSize(uniforms){
        let size= uniforms
        .map((uniform) =>{ if(uniform.type==='number') { 
            return uniform.size
        }else{
            return 0;
        }
    }).reduce((a, b) => a + b, 0);
        return size;
    }
    public destory(){
        this.label=undefined;
        this.type=undefined;
        this.baseTexture=undefined;
        this.baseSampler=undefined;
        this.renderState=undefined;
        this.color=undefined;
        this.alpha=undefined;
        this.uniformsDataBuffer=undefined
        this.uniforms=undefined;
    }
}