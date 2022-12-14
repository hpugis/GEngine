import Matrix2 from "../math/Matrix2";
import Matrix3 from "../math/Matrix3";
import Matrix4 from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import Vector3 from "../math/Vector3";

export default class RenderObject{
    private _position:Vector3;
    private _scale:Vector3;
    private _quaternion:Quaternion;
    modelMatrix: Matrix4;
    private _normalMatrix: Matrix3;
    constructor(){
        this._position=new Vector3();
        this._scale=new Vector3(1,1,1);
        this._quaternion=new Quaternion();
        this.modelMatrix=Matrix4.clone(Matrix4.IDENTITY,new Matrix4());
        this._normalMatrix=Matrix3.clone(Matrix3.IDENTITY,new Matrix3());
    }    
    
    public get normalMatrix() : Matrix3 {
        return this._normalMatrix
    }
    
    public get position() : Vector3 {
        return this._position
    }
    public get scale() : Vector3 {
        return this._scale
    }
    public get quaternion():Quaternion{
        return this._quaternion
    }
    updateNormalMatrix(camera){
        Matrix4.multiply(camera.viewMatrix, this.modelMatrix,this._normalMatrix);
        Matrix4.inverse(this._normalMatrix,this._normalMatrix);
        Matrix4.transpose(this._normalMatrix,this._normalMatrix)
    }
    updateMatrix(){
        this.modelMatrix=Matrix4.fromTranslationQuaternionRotationScale(this.position,this.quaternion,this.scale,this.modelMatrix);
    }
    rotateOnAxis( axis, angle ) {
        const quat=Quaternion.fromAxisAngle(axis,angle);
        Quaternion.multiply(this.quaternion,quat,this.quaternion)
	}
    rotateX( angle ) {
		return this.rotateOnAxis( _xAxis, angle );
	}
	rotateY( angle ) {
		return this.rotateOnAxis( _yAxis, angle );
	}
	rotateZ( angle ) {
		return this.rotateOnAxis( _zAxis, angle );
	}
}
const _xAxis = new Vector3( 1, 0, 0 );
const _yAxis = new Vector3( 0, 1, 0 );
const _zAxis = new Vector3( 0, 0, 1 );