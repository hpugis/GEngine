import {
  GPUCanvasCompositingAlphaMode,
} from "../core/WebGPUTypes";
import{TextureUsage} from '../core/WebGPUConstant'
import { ContextOptions } from "../core/WebGPUTypes";
import { RenderPipelineCache } from "./RenderPipelineCache.js";
import DrawCommand from "./DrawCommand.js";
import RenderTarget from "./RenderTarget";
import RenderState from "./RenderState";
import BindGroupLayout from "./BindGroupLayout";
import BindGroup from "./BindGroup";
import SystemRenderResource from "../core/SystemRenderResource";

class Context {
  public canvas: HTMLCanvasElement;

  public context: GPUCanvasContext;

  public pixelRatio: number;

  public device:GPUDevice;

  private adapter: GPUAdapter;

  public commandEncoder: GPUCommandEncoder | null;

  private passEncoder: GPURenderPassEncoder | GPUComputePassEncoder | null;
 
  public renderPipelineCache:RenderPipelineCache;
  
  public currentRenderTarget:RenderTarget;

  public systemRenderResource:SystemRenderResource;

  public presentationSize:{width:number, height:number, depth:number};
  
  public presentationFormat :GPUTextureFormat

  constructor({ canvas,container, context, pixelRatio, }: ContextOptions = {}) {
    this.canvas = canvas || document.createElement("canvas");
    this.canvas.style.display = 'block';
    this.canvas.width= window.innerWidth;
    this.canvas.height=window.innerHeight;
    container.appendChild(this.canvas);
    this.context =context || (this.canvas.getContext("webgpu") as GPUCanvasContext);
    this.pixelRatio = pixelRatio || window.devicePixelRatio || 1;   
    this.device=undefined;
  }

  public async init(
    requestAdapter = {},
    deviceDescriptor = {},
    presentationContextDescriptor = {},
    // glslangPath: string
  ): Promise<boolean> {
    try {
      if (!this.context) {
        throw new Error(`Failed to instantiate "webgpu" context.`);
      }
      if (!navigator.gpu) {
        throw new Error(`Missing "navigator.gpu".`);
      }

      this.adapter = await navigator.gpu.requestAdapter();
      this.device = await this.adapter.requestDevice();
      this.presentationSize = {
        width:this.canvas.clientWidth * this.pixelRatio,
        height:this.canvas.clientHeight * this.pixelRatio,
        depth:1
      };
      this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      this.device.addEventListener("uncapturederror", (error) => {
        console.log(error);
        //State.error = true;
      });

      this.context.configure({
        device: this.device,
       // format: navigator.gpu.getPreferredCanvasFormat(),
        format:this.presentationFormat,
        usage: TextureUsage.RenderAttachment,
        alphaMode: GPUCanvasCompositingAlphaMode.Premultiplied,
        ...presentationContextDescriptor,
      });
      this.renderPipelineCache=new RenderPipelineCache(this.device);
      this.systemRenderResource=new SystemRenderResource();
      
    } catch (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  public resize(
    width: number,
    height: number,
    presentationContextDescriptor = {}
  ): void {
    const w = width * this.pixelRatio;
    const h = height * this.pixelRatio;
    this.canvas.width = w;
    this.canvas.height = h;
    Object.assign(this.canvas.style, { width, height });

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      usage: TextureUsage.RenderAttachment,
      alphaMode: GPUCanvasCompositingAlphaMode.Premultiplied,
      ...presentationContextDescriptor,
    });
  }

  private submit(command: DrawCommand,subcommand?: () => unknown): void {
    if (!this.commandEncoder) {
      console.warn("You need to submit commands inside the render callback.");
      return;
    }
      //let pipeline;
      if (command.type === "render") {
        this.currentRenderTarget.renderPassDescriptor.colorAttachments[0].view = this.context
        .getCurrentTexture()
        .createView();
        this.passEncoder = this.commandEncoder.beginRenderPass(this.currentRenderTarget.renderPassDescriptor);
      } else if (command.type === "compute") {
        this.passEncoder = this.commandEncoder.beginComputePass();
      }
    
    
    if (command.pipeline) {
        command.pipeline.bind(this.passEncoder)
    }
    if (command.renderState) {
      RenderState.applyRenderState(this.passEncoder as GPURenderPassEncoder,command.renderState)
    }
    if (command.vertexBuffers) {
      command.vertexBuffers.bind(this.passEncoder as GPURenderPassEncoder)
    }

    if (command.indexBuffer) {
      (this.passEncoder as GPURenderPassEncoder).setIndexBuffer(
        command.indexBuffer.gpuBuffer,
        command.indexFormat
      );
    }

    if (command.bindGroups) {
      const combineBindGroups=command.bindGroups.concat(this.systemRenderResource.groups).sort((group1,group2)=>group1.index-group2.index)
      for (let i = 0; i < combineBindGroups.length; i++) {
        this.passEncoder.setBindGroup(combineBindGroups[i].index, combineBindGroups[i].gpuBindGroup);
      }
    }
    if (command.indexBuffer) {
      (this.passEncoder as GPURenderPassEncoder).drawIndexed(
        command.count || 0,
        command.instances || 1,
        0,
        0,
        0
      );
    } else if (command.count) {
      (this.passEncoder as GPURenderPassEncoder).draw(
        command.count,
        command.instances || 1,
        0,
        0
      );
    } else if (command.dispatch) {
      (this.passEncoder as GPUComputePassEncoder).dispatch(
        ...((Array.isArray(command.dispatch)
          ? command.dispatch
          : [command.dispatch]) as [number, number?, number?])
      );
    }

    if (subcommand) subcommand();
      this.passEncoder?.end();
      this.passEncoder = null;
  }
  public render(drawCommand:DrawCommand): void {
    this.commandEncoder = this.device.createCommandEncoder();
    // Submit commands
    this.submit(drawCommand);
    this.device.queue.submit([this.commandEncoder.finish()]);
    this.commandEncoder = null;
  }
}

export default Context;
