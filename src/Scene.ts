import Camera from "./camera/Camera";
import PerspectiveCamera from "./camera/PerspectiveCamera";
import { EventDispatcher } from "./core/EventDispatcher";
import { FrameState } from "./core/FrameState";
import LightManger from "./core/LightManger";
import PrimitiveManger from "./core/PrimitiveManger";
import Context from "./render/Context";
import ForwardRenderLine from "./renderpipeline/ForwardRenderLine";
import IBaseRenderLine from "./renderpipeline/IBaseRenderLine";

export class Scene extends EventDispatcher {
    lightManger: LightManger;
    primitiveManger: PrimitiveManger;
    camera: PerspectiveCamera;
    context: Context;
    requestAdapter: {};
    deviceDescriptor: {};
    presentationContextDescriptor: {};
    container: HTMLDivElement;
    frameState: FrameState;
    currentRenderPipeline:IBaseRenderLine;
    private ready: boolean;
    viewport: { x: number; y: number; width: number; height: number; };
    constructor(options) {
        super();
        this.container = options.container instanceof HTMLDivElement? options.container:document.getElementById(options.container);
        this.lightManger = new LightManger();
        this.primitiveManger = new PrimitiveManger();
        this.context = new Context({ canvas: null,container:this.container,pixelRatio:1});
        // this.container.appendChild(this.context.canvas);
        this.requestAdapter = options.requestAdapter||{};
        this.deviceDescriptor = options.deviceDescriptor||{};
        this.presentationContextDescriptor = options.presentationContextDescriptor;
        this.ready=false;
        this.init();
    }
    private async init() {
        if (!(await this.context.init(this.requestAdapter, this.deviceDescriptor, this.presentationContextDescriptor))) {
            throw new Error("Your browser doesn't support WebGPU.");
        } else {
            this.currentRenderPipeline=new ForwardRenderLine(this.context);
            this.frameState = new FrameState(this.context);
            this.ready=true;
            this.viewport={
                x:0,
                y:0,
                width:this.context.presentationSize.width,
                height:this.context.presentationSize.height
            }
        }
    }
    add(instance) {
        if (instance.type === 'primitive' && !this.primitiveManger.contains(instance)) {
            this.primitiveManger.add(instance)
        }
    }
    addLight(light) {
        this.lightManger.add(light);
    }
    setCamera(camera) {
        this.camera = camera;
    }
    remove(instance) {
        if (instance.type === 'primitive' && !this.primitiveManger.contains(instance)) {
            this.primitiveManger.remove(instance)
        }
    }
    getPrimitiveById() {

    }
    render() {
        this.update();
    }
    private update() {
    if(!this.ready) return;
        //更新相机
        this.frameState.viewport=this.viewport;
        this.frameState.update(this.camera);
        //更新灯光
        this.lightManger.update(this.frameState);
        this.context.systemRenderResource.update(this.frameState,this)

        //update primitive and select
        this.primitiveManger.update(this.frameState)
        
        //selct renderPipeline
        this.currentRenderPipeline.setRenderList({
            opaque:this.frameState.commandList.opaque,
            transparent:this.frameState.commandList.transparent
        });
        this.currentRenderPipeline.render();
    }

}