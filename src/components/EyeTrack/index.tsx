import * as THREE from "three";

import type {
  FaceLandmarker,
  ImageSource,
  FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { PREPARED_ASSETS } from "../../PREPARED";
import { Resource, onMount } from "solid-js";

import { MediapipeResource } from "../../util/prepareModels";

const blendshapesMap = {
  // '_neutral': '',
  browDownLeft: "browDown_L",
  browDownRight: "browDown_R",
  browInnerUp: "browInnerUp",
  browOuterUpLeft: "browOuterUp_L",
  browOuterUpRight: "browOuterUp_R",
  cheekPuff: "cheekPuff",
  cheekSquintLeft: "cheekSquint_L",
  cheekSquintRight: "cheekSquint_R",
  eyeBlinkLeft: "eyeBlink_L",
  eyeBlinkRight: "eyeBlink_R",
  eyeLookDownLeft: "eyeLookDown_L",
  eyeLookDownRight: "eyeLookDown_R",
  eyeLookInLeft: "eyeLookIn_L",
  eyeLookInRight: "eyeLookIn_R",
  eyeLookOutLeft: "eyeLookOut_L",
  eyeLookOutRight: "eyeLookOut_R",
  eyeLookUpLeft: "eyeLookUp_L",
  eyeLookUpRight: "eyeLookUp_R",
  eyeSquintLeft: "eyeSquint_L",
  eyeSquintRight: "eyeSquint_R",
  eyeWideLeft: "eyeWide_L",
  eyeWideRight: "eyeWide_R",
  jawForward: "jawForward",
  jawLeft: "jawLeft",
  jawOpen: "jawOpen",
  jawRight: "jawRight",
  mouthClose: "mouthClose",
  mouthDimpleLeft: "mouthDimple_L",
  mouthDimpleRight: "mouthDimple_R",
  mouthFrownLeft: "mouthFrown_L",
  mouthFrownRight: "mouthFrown_R",
  mouthFunnel: "mouthFunnel",
  mouthLeft: "mouthLeft",
  mouthLowerDownLeft: "mouthLowerDown_L",
  mouthLowerDownRight: "mouthLowerDown_R",
  mouthPressLeft: "mouthPress_L",
  mouthPressRight: "mouthPress_R",
  mouthPucker: "mouthPucker",
  mouthRight: "mouthRight",
  mouthRollLower: "mouthRollLower",
  mouthRollUpper: "mouthRollUpper",
  mouthShrugLower: "mouthShrugLower",
  mouthShrugUpper: "mouthShrugUpper",
  mouthSmileLeft: "mouthSmile_L",
  mouthSmileRight: "mouthSmile_R",
  mouthStretchLeft: "mouthStretch_L",
  mouthStretchRight: "mouthStretch_R",
  mouthUpperUpLeft: "mouthUpperUp_L",
  mouthUpperUpRight: "mouthUpperUp_R",
  noseSneerLeft: "noseSneer_L",
  noseSneerRight: "noseSneer_R",
  // '': 'tongueOut'
};

export function setupEyeTrack(
  canvas: HTMLCanvasElement | undefined,
  onUpdatePoint?: (payload: { x: number; y: number }) => void,
  options = {} as {
    ready?: () => boolean | undefined;
    getDetectSource?: () => ImageSource | undefined | null;
    faceLandmarkerGetter?: () => FaceLandmarker | undefined;
    jsmBasePath?: string;
    gltfFile?: string;
  }
) {
  options.jsmBasePath = options.jsmBasePath || PREPARED_ASSETS.jsmBasePath;
  options.gltfFile = options.gltfFile || PREPARED_ASSETS.faceCap;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(360, 240);
  renderer.useLegacyLights = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // 主场景
  const scene = new THREE.Scene();
  scene.scale.x = -1;

  //   console.info("scene", scene);

  // 平面
  const planeGeo = new THREE.PlaneGeometry(10, 10);
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.lookAt(new THREE.Vector3(0, 0, 0)); // 使平面朝向原点

  scene.add(plane);

  // axis

  // 创建坐标原点
  const origin = new THREE.Vector3(0, 0, 0);
  // 创建坐标轴方向
  const xDir = new THREE.Vector3(1, 0, 0);
  const yDir = new THREE.Vector3(0, 1, 0);
  const zDir = new THREE.Vector3(0, 0, 1);

  // 创建箭头
  const xAxis = new THREE.ArrowHelper(xDir, origin, 5);
  const yAxis = new THREE.ArrowHelper(yDir, origin, 5);
  const zAxis = new THREE.ArrowHelper(zDir, origin, 5);

  // 设置颜色
  xAxis.setColor(0xff0000); // red
  yAxis.setColor(0x00ff00); // green
  zAxis.setColor(0x0000ff); // blue

  scene.add(xAxis);
  scene.add(yAxis);
  scene.add(zAxis);

  // face 默认位置 原点 正面朝向正 Z 轴

  // 参照物 - 笔记本摄像头位置
  // 创建屏幕几何体
  const mbpGeometry = new THREE.BoxGeometry(3.226, 2.122, 0.155); // 322.6mm*212.2mm*15.5mm
  mbpGeometry.computeBoundingBox();
  // 创建每个面的材质
  const materialArray = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // 正面红色
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // 背面绿色
    new THREE.MeshBasicMaterial({ color: 0x0000ff }), // 顶部蓝色
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), // 底部黄色
    new THREE.MeshBasicMaterial({ color: 0xff00ff }), // 左侧品红色
    new THREE.MeshBasicMaterial({ color: 0x00ffff }), // 右侧青色
  ];
  // 创建Mesh
  const mbpCube = new THREE.Mesh(mbpGeometry, materialArray);
  mbpCube.position.y = -1.2;
  mbpCube.position.z = 0;
  scene.add(mbpCube);

  // 面容位置辅助线框
  const frameGeometry = new THREE.BoxGeometry(2, 2.2, 2.2);
  const frameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  // 调整旋转中心
  frameGeometry.translate(0, 0.3, -0.3);
  const frameCube = new THREE.Mesh(frameGeometry, frameMaterial);
  scene.add(frameCube);

  // 从侧后方观察笔记本和人脸位置
  const camera = new THREE.PerspectiveCamera(75, 640 / 480, 1, 100);
  camera.position.set(3, -0.5, -8);
  camera.lookAt(scene.position);

  const environment = new RoomEnvironment(renderer);
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  scene.background = new THREE.Color(0x666666);
  scene.environment = pmremGenerator.fromScene(environment).texture;

  const controls = new OrbitControls(camera, renderer.domElement);
  const transform = new THREE.Object3D();

  /**
   * ray - 射线 --> ArrowHelper - 渲染物体
   * --> 转为世界坐标 - 以计算交点
   */
  // eye ray
  const ray1 = new THREE.Ray();
  const ray1Helper = new THREE.ArrowHelper(
    ray1.direction,
    ray1.origin,
    10,
    0xff0000
  );

  // 转为世界坐标系
  const ray1WorldHelper = new THREE.ArrowHelper(
    ray1.direction,
    ray1.origin,
    3,
    0x00ffff
  ); // cyan

  scene.add(ray1WorldHelper);

  // 圆球 - 指示交点
  const dotGeometry = new THREE.SphereGeometry(0.2, 32, 16);
  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(dotGeometry, dotMaterial);
  sphere.position.set(0, 0, 0);
  scene.add(sphere);
  const point = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color: 0xff0000,
      size: 2,
      opacity: 0.5,
    })
  );
  point.position.set(0, 0, 0);
  const intersectPoint = new THREE.Vector3();

  scene.add(point);

  // Face
  const ktx2Loader = new KTX2Loader()
    // static path
    .setTranscoderPath(options.jsmBasePath)
    .detectSupport(renderer);

  new GLTFLoader()
    .setKTX2Loader(ktx2Loader)
    .setMeshoptDecoder(MeshoptDecoder)
    .load(options.gltfFile, (gltf) => {
      const mesh = gltf.scene.children[0];
      scene.add(mesh);

      const head = mesh.getObjectByName("mesh_2")!;
      (head as any)!.material = new THREE.MeshNormalMaterial();

      const leftEye = mesh.getObjectByName("grp_eyeLeft")!;
      const rightEye = mesh.getObjectByName("grp_eyeRight")!;
      // 射线 - 起点位于两眼之间
      if (leftEye && rightEye) {
        ray1.origin.copy(leftEye.position);
        ray1.origin.setX((leftEye.position.x + rightEye.position.x) / 2);
        ray1.direction.set(0, 1, 0).applyQuaternion(leftEye.quaternion);

        ray1Helper.setDirection(ray1.direction);
        ray1Helper.setLength(50);
        ray1Helper.position.copy(ray1.origin);
        // ? 没看懂的转换关系 - 本地坐标要按此方向旋转 90 度, 转为世界坐标后, 方向才正确
        // - 像是下边 transform 中的 y z 有对调
        ray1Helper.rotateX(-Math.PI / 2);
        leftEye.parent!.add(ray1Helper);

        const worldPosition = new THREE.Vector3();
        const worldDirection = new THREE.Vector3();

        ray1Helper.getWorldPosition(worldPosition);
        ray1Helper.getWorldDirection(worldDirection);

        startRender();
      } else {
        console.warn("no eye", scene);
      }
    });

  function startRender() {
    renderer.setAnimationLoop(animation);
  }
  // video
  //   const texture = new THREE.VideoTexture(video);
  //   texture.colorSpace = THREE.SRGBColorSpace;

  // const geometry = new THREE.PlaneGeometry(1, 1);
  // const material = new THREE.MeshBasicMaterial({
  //   map: texture,
  //   depthWrite: false,
  // });
  // const videomesh = new THREE.Mesh(geometry, material);
  // videomesh.position.z = -2;
  // scene.add(videomesh);

  /**
   * MediaPipe Task Vision 识别
   * @param detectTarget: ImageSource
   * @returns
   */
  function detectViaMediaPipe(
    faceLandmarker: FaceLandmarker,
    detectTarget: ImageSource
  ) {
    let results: FaceLandmarkerResult;
    if (detectTarget instanceof HTMLVideoElement) {
      if (detectTarget.readyState >= HTMLMediaElement.HAVE_METADATA) {
        results = faceLandmarker.detectForVideo(detectTarget, Date.now());
      } else {
        return;
      }
    } else {
      // TODO other type image data
      results = faceLandmarker.detectForVideo(detectTarget, Date.now());
    }

    if (results.facialTransformationMatrixes.length > 0) {
      const facialTransformationMatrixes =
        results.facialTransformationMatrixes[0].data;

      transform.matrix.fromArray(facialTransformationMatrixes);
      transform.matrix.decompose(
        transform.position,
        transform.quaternion,
        transform.scale
      );

      const object = scene.getObjectByName("grp_transform")!;

      // 视角

      object.position.x = -transform.position.x;
      object.position.y = transform.position.z;
      object.position.z = -transform.position.y;

      object.rotation.x = transform.rotation.x; // 俯仰
      object.rotation.y = -transform.rotation.z; // 歪头
      object.rotation.z = transform.rotation.y; // 扭头

      // 与上述 object 相对, 少了一层 grp_scale; 手动调整 scale
      frameCube.position.x = -transform.position.x / 10;
      frameCube.position.y = transform.position.y / 10;
      frameCube.position.z = transform.position.z / 10;

      frameCube.rotation.x = transform.rotation.x;
      frameCube.rotation.y = -transform.rotation.y;
      frameCube.rotation.z = -transform.rotation.z;

      // 重新计算交点
      try {
        ray1Helper.updateWorldMatrix(true, false);

        const rayOrigin = new THREE.Vector3();
        const rayDirection = new THREE.Vector3();

        // console.info('rayOrigin -', rayOrigin, rayDirection)
        ray1Helper.getWorldPosition(rayOrigin);
        ray1Helper.getWorldDirection(rayDirection);

        ray1WorldHelper.position.copy(scene.worldToLocal(rayOrigin.clone()));

        ray1WorldHelper.setDirection(scene.worldToLocal(rayDirection.clone()));
        // const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
        const rayDup = new THREE.Ray(
          scene.worldToLocal(rayOrigin.clone()),
          scene.worldToLocal(rayDirection.clone())
        );
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1));

        // 计算交点
        rayDup.intersectPlane(plane, intersectPoint);
        sphere.position.copy(intersectPoint);

        onUpdatePoint?.({ x: intersectPoint.x, y: intersectPoint.y });
      } catch (error) {
        console.error("intersect fail", error, mbpCube, ray1);
      }
    }

    // 面部表情参数
    if (results.faceBlendshapes.length > 0) {
      const face = scene.getObjectByName("mesh_2")!;

      const faceBlendshapes = results.faceBlendshapes[0].categories;

      for (const blendshape of faceBlendshapes) {
        const categoryName = blendshape.categoryName;
        const score = blendshape.score;

        const index = (face as any).morphTargetDictionary[
          blendshapesMap[categoryName as keyof typeof blendshapesMap]
        ];

        if (index !== undefined) {
          (face as any).morphTargetInfluences[index] = score;
        }
      }
    }
  }

  function animation() {
    const detectTarget = options.getDetectSource?.();
    const faceLandmarker = options.faceLandmarkerGetter?.();
    if (faceLandmarker && detectTarget) {
      detectViaMediaPipe(faceLandmarker, detectTarget);
    } else {
      // skip
    }

    // videomesh.scale.x = video.videoWidth / 100;
    // videomesh.scale.y = video.videoHeight / 100;

    if (canvas && options.ready?.()) {
      renderer.render(scene, camera);
      controls.update();
    }
  }

  function stopRender() {
    renderer.setAnimationLoop(null);
  }

  function destroy() {
    renderer.setAnimationLoop(null);
    renderer.dispose(); // 释放引擎资源
    renderer.forceContextLoss(); // 强制丢失上下文
    renderer.domElement = null as any; // 清空绑定的dom元素
  }

  // 切换 canvas 渲染
  function recreate(_canvasRef?: HTMLCanvasElement) {
    // TODO
  }

  return {
    recreate,
    startRender,
    stopRender,
    destroy,
  };
}

// 空间示意图
export function SetupEyeTrack(props: {
  /** 开启显示示意图 */
  enableMonitor?: boolean;
  getCanvasRef?: () => HTMLCanvasElement | undefined;
  getDetectSource?: () => ImageSource | undefined;
  visionModel: Resource<MediapipeResource>;
  onUpdate?: (point: { x: number; y: number }) => void;
}) {
  let controller: ReturnType<typeof setupEyeTrack>;

  // 开启 eyeTrack
  onMount(() => {
    controller = setupEyeTrack(
      props.getCanvasRef?.(),
      function (val) {
        return props.onUpdate?.(val);
      },
      {
        // ready 在 requestAnimation cb 中使用 - 不需要处理更改
        ready: () => props.enableMonitor,
        faceLandmarkerGetter: () => props.visionModel()?.faceLandmarker,
        getDetectSource: () => props.getDetectSource?.(),
      }
    );

    return () => {
      controller.destroy();
    };
  });

  return null;
}

export default SetupEyeTrack;
