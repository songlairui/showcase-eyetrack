import { Show, createEffect, createMemo, createResource, createSignal, onMount, useTransition } from 'solid-js'
import './App.css'
import css from './App.module.css'

import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
// import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'

import * as THREE from 'three'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { PREPARED_ASSETS } from './PREPARED'

// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


declare let chrome: any

// import {} from '@mediapipe/tasks-vision/wasm/'
async function prepare() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    // "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    PREPARED_ASSETS.visionBasePath
  );
  const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      // modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      modelAssetPath: PREPARED_ASSETS.faceLandmarker,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    runningMode: 'VIDEO',
    numFaces: 1
  })

  return {
    filesetResolver,
    faceLandmarker
  }
}
// const videoWidth = 480;

function App() {
  const [camEnabled, setEnableCam] = createSignal(false)

  const [videoStream, setVideoStream] = createSignal<MediaStream>()

  const [result] = createSignal<FaceLandmarkerResult>()

  const [point, setPoint] = createSignal<{ x: number, y: number }>({ x: 0, y: 0 })


  const [boundary, setBoundary] = createSignal<{
    l: number,
    t_outer: number,
    t: number,
    w_outer: number,
    w: number,
    h_outer: number,
    h: number,
  }>({
    l: 0,
    t_outer: 0,
    t: 72,
    w_outer: 0,
    w: 1024,
    h_outer: 0,
    h: 720
  })

  const [winSize, setWinSize] = createSignal<{ w: number, h: number, sysBar: number }>({ w: 1024, h: 768, sysBar: 26 })

  const screenPoint = createMemo(() => {
    return {
      left: (point().x + 1) * (winSize().w / 2),
      top: -point().y * (winSize().h)
    }
  })

  const viewportPoint = createMemo(() => {
    return {
      left: screenPoint().left - boundary().l,
      top: screenPoint().top - boundary().t
    }
  })


  const [model] = createResource(prepare)

  let THREE_renderer: THREE.WebGLRenderer | undefined

  createEffect(() => {
    console.info('result', result())
  })

  const [isPending, start] = useTransition();


  let videoRef: HTMLVideoElement | undefined
  let canvasRef: HTMLCanvasElement | undefined
  let threeRef: HTMLCanvasElement | undefined

  async function toggleCam() {
    const nextState = !camEnabled()
    start(async () => {
      if (nextState) {
        // 打开摄像头
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setVideoStream(stream)
        if (videoRef) {
          videoRef.srcObject = stream
          videoRef.play()
        }
      } else {
        // 关闭摄像头
        videoStream()?.getTracks().forEach(track => {
          track.stop()
        })
        setVideoStream(undefined)
      }

      setEnableCam(nextState)
    }
    )
    if (camEnabled()) {
      setEnableCam(false)
      return
    }

  }

  // let lastVideoTime: number
  // let results: FaceLandmarkerResult

  // async function _predict() {
  //   if (Math.random() > -1) {
  //     return;
  //   }

  //   const video = videoRef!
  //   const canvasElement = canvasRef!
  //   const radio = video.videoHeight / video.videoWidth;
  //   video.style.width = videoWidth + "px";
  //   video.style.height = videoWidth * radio + "px";
  //   canvasElement.style.width = videoWidth + "px";
  //   canvasElement.style.height = videoWidth * radio + "px";
  //   canvasElement.width = video.videoWidth;
  //   canvasElement.height = video.videoHeight;

  //   const canvasCtx = canvasElement.getContext("2d");
  //   const drawingUtils = new DrawingUtils(canvasCtx!);

  //   let nowInMs = Date.now();
  //   if (lastVideoTime !== video.currentTime) {
  //     lastVideoTime = video.currentTime;
  //     results = model()!.faceLandmarker.detectForVideo(video, nowInMs);
  //     setResult(results)
  //   }


  //   if (results.faceLandmarks) {

  //     for (const landmarks of results.faceLandmarks) {
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_TESSELATION,
  //         { color: "#C0C0C070", lineWidth: 1 }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
  //         { color: "#FF3030" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
  //         { color: "#FF3030" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
  //         { color: "#30FF30" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
  //         { color: "#30FF30" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
  //         { color: "#E0E0E0" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_LIPS,
  //         { color: "#E0E0E0" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
  //         { color: "#FF3030" }
  //       );
  //       drawingUtils.drawConnectors(
  //         landmarks,
  //         FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
  //         { color: "#30FF30" }
  //       );
  //     }
  //   }
  //   // drawBlendShapes(videoBlendShapes, results.faceBlendshapes);

  //   if (camEnabled()) {
  //     window.requestAnimationFrame(predict)
  //   }
  // }

  const blendshapesMap = {
    // '_neutral': '',
    'browDownLeft': 'browDown_L',
    'browDownRight': 'browDown_R',
    'browInnerUp': 'browInnerUp',
    'browOuterUpLeft': 'browOuterUp_L',
    'browOuterUpRight': 'browOuterUp_R',
    'cheekPuff': 'cheekPuff',
    'cheekSquintLeft': 'cheekSquint_L',
    'cheekSquintRight': 'cheekSquint_R',
    'eyeBlinkLeft': 'eyeBlink_L',
    'eyeBlinkRight': 'eyeBlink_R',
    'eyeLookDownLeft': 'eyeLookDown_L',
    'eyeLookDownRight': 'eyeLookDown_R',
    'eyeLookInLeft': 'eyeLookIn_L',
    'eyeLookInRight': 'eyeLookIn_R',
    'eyeLookOutLeft': 'eyeLookOut_L',
    'eyeLookOutRight': 'eyeLookOut_R',
    'eyeLookUpLeft': 'eyeLookUp_L',
    'eyeLookUpRight': 'eyeLookUp_R',
    'eyeSquintLeft': 'eyeSquint_L',
    'eyeSquintRight': 'eyeSquint_R',
    'eyeWideLeft': 'eyeWide_L',
    'eyeWideRight': 'eyeWide_R',
    'jawForward': 'jawForward',
    'jawLeft': 'jawLeft',
    'jawOpen': 'jawOpen',
    'jawRight': 'jawRight',
    'mouthClose': 'mouthClose',
    'mouthDimpleLeft': 'mouthDimple_L',
    'mouthDimpleRight': 'mouthDimple_R',
    'mouthFrownLeft': 'mouthFrown_L',
    'mouthFrownRight': 'mouthFrown_R',
    'mouthFunnel': 'mouthFunnel',
    'mouthLeft': 'mouthLeft',
    'mouthLowerDownLeft': 'mouthLowerDown_L',
    'mouthLowerDownRight': 'mouthLowerDown_R',
    'mouthPressLeft': 'mouthPress_L',
    'mouthPressRight': 'mouthPress_R',
    'mouthPucker': 'mouthPucker',
    'mouthRight': 'mouthRight',
    'mouthRollLower': 'mouthRollLower',
    'mouthRollUpper': 'mouthRollUpper',
    'mouthShrugLower': 'mouthShrugLower',
    'mouthShrugUpper': 'mouthShrugUpper',
    'mouthSmileLeft': 'mouthSmile_L',
    'mouthSmileRight': 'mouthSmile_R',
    'mouthStretchLeft': 'mouthStretch_L',
    'mouthStretchRight': 'mouthStretch_R',
    'mouthUpperUpLeft': 'mouthUpperUp_L',
    'mouthUpperUpRight': 'mouthUpperUp_R',
    'noseSneerLeft': 'noseSneer_L',
    'noseSneerRight': 'noseSneer_R',
    // '': 'tongueOut'
  };

  function prepareThree() {
    const video = videoRef!
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: threeRef
    })
    THREE_renderer = renderer
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(640, 480);
    renderer.useLegacyLights = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;


    // 主场景
    const scene = new THREE.Scene()
    scene.scale.x = -1;

    console.info('scene', scene)

    // 平面
    const planeGeo = new THREE.PlaneGeometry(10, 10);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);

    plane.lookAt(new THREE.Vector3(0, 0, 0)); // 使平面朝向原点

    // plane.rotation.x = Math.PI / 2; // 旋转 90 度,让面朝向 z 轴
    scene.add(plane);

    // axis
    // const axesHelper = new THREE.AxesHelper(5);
    // scene.add(axesHelper);

    // 创建坐标轴方向
    const xDir = new THREE.Vector3(1, 0, 0);
    const yDir = new THREE.Vector3(0, 1, 0);
    const zDir = new THREE.Vector3(0, 0, 1);

    // 创建坐标原点
    const origin = new THREE.Vector3(0, 0, 0);

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
    // 创建Macbook几何体
    const mbpGeometry = new THREE.BoxGeometry(3.226, 2.122, 0.155); // 322.6mm*212.2mm*15.5mm
    mbpGeometry.computeBoundingBox()
    // 创建每个面的材质
    const materialArray = [
      new THREE.MeshBasicMaterial({ color: 0xff0000 }), // 正面红色
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // 背面绿色
      new THREE.MeshBasicMaterial({ color: 0x0000ff }), // 顶部蓝色
      new THREE.MeshBasicMaterial({ color: 0xffff00 }), // 底部黄色
      new THREE.MeshBasicMaterial({ color: 0xff00ff }), // 左侧品红色
      new THREE.MeshBasicMaterial({ color: 0x00ffff })  // 右侧青色
    ];
    // 创建Mesh
    const mbpCube = new THREE.Mesh(mbpGeometry, materialArray);
    mbpCube.position.y = -1.2;
    mbpCube.position.z = 0;
    scene.add(mbpCube);

    const frameGeometry = new THREE.BoxGeometry(2, 2.2, 2.2);
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      wireframe: true
    });

    // 调整旋转中心
    frameGeometry.translate(0, 0.3, -0.3);

    const frameCube = new THREE.Mesh(frameGeometry, frameMaterial);
    scene.add(frameCube)


    // 从侧面观察笔记本和人脸位置

    const camera = new THREE.PerspectiveCamera(75, 640 / 480, 1, 100)
    // camera.position.z = 10
    // 侧后方
    camera.position.set(3, -0.5, -8)
    camera.lookAt(scene.position)

    const environment = new RoomEnvironment(renderer)
    const pmremGenerator = new THREE.PMREMGenerator(renderer)

    scene.background = new THREE.Color(0x666666)
    scene.environment = pmremGenerator.fromScene(environment).texture

    const controls = new OrbitControls(camera, renderer.domElement)
    const transform = new THREE.Object3D();

    // eye ray
    const ray1 = new THREE.Ray();
    // ray1 转为世界坐标系
    const ray1Helper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 10, 0xff0000)
    // const ray2Helper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 10, 0x00ff00)
    // const ray3Helper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 10, 0x00ff00)
    // const ray4Helper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 10, 0x000ff0)
    // const ray5Helper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 10, 0x0000ff)

    const ray1WorldHelper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 3, 0x00ffff) // cyan
    const ray2WorldHelper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 3, 0xff00ff) // 
    const ray3WorldHelper = new THREE.ArrowHelper(ray1.direction, ray1.origin, 3, 0xffff00) // yellow

    scene.add(ray1WorldHelper)
    scene.add(ray2WorldHelper)
    scene.add(ray3WorldHelper)

    // 交点
    const dotGeometry = new THREE.SphereGeometry(0.2, 32, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(dotGeometry, dotMaterial);
    sphere.position.set(0, 0, 0)
    scene.add(sphere);
    const point = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xff0000,
        size: 2,
        // opacity: .5,
      })
    );
    point.position.set(0, 0, 0);
    const intersectPoint = new THREE.Vector3();

    // ray1.intersectBox(mbpCube.geometry.boundingBox!, intersectPoint);
    // point.position.copy(intersectPoint);

    scene.add(point);

    // Face
    const ktx2Loader = new KTX2Loader()
      // static path
      .setTranscoderPath(PREPARED_ASSETS.jsmBasePath)
      .detectSupport(renderer)

    new GLTFLoader()
      .setKTX2Loader(ktx2Loader)
      .setMeshoptDecoder(MeshoptDecoder)
      .load(PREPARED_ASSETS.faceCap, gltf => {
        // 
        const mesh = gltf.scene.children[0]
        scene.add(mesh)
        console.info('mesh Head', gltf.scene)

        const head = mesh.getObjectByName('mesh_2')!;
        (head as any)!.material = new THREE.MeshNormalMaterial()


        const leftEye = mesh.getObjectByName('grp_eyeLeft')!;
        const rightEye = mesh.getObjectByName('grp_eyeRight')!;
        // 计算射线方向
        if (leftEye && rightEye) {
          ray1.origin.copy(leftEye.position);
          ray1.origin.setX((leftEye.position.x + rightEye.position.x) / 2)
          ray1.direction.set(0, 1, 0)
            .applyQuaternion(leftEye.quaternion);

          ray1Helper.setDirection(ray1.direction);
          ray1Helper.setLength(50);
          ray1Helper.position.copy(ray1.origin);
          // 没看懂的转换关系 - 就像下边 transform 中的 y z 有对掉一样
          ray1Helper.rotateX(-Math.PI / 2)
          leftEye.parent!.add(ray1Helper);

          console.info('setup', leftEye.position, rightEye.position, ray1.origin, ray1Helper.position)

          const worldPosition = new THREE.Vector3()
          const worldDirection = new THREE.Vector3()

          console.info('worldPosition - -', worldPosition)
          ray1Helper.getWorldPosition(worldPosition)
          ray1Helper.getWorldDirection(worldDirection)

          // // 本层
          // console.info('worldPosition - 0', worldPosition)
          // ray5Helper.setLength(30)
          // ray5Helper.setDirection(targetParent.worldToLocal(worldDirection))
          // ray5Helper.position.copy(targetParent.worldToLocal(worldPosition))
          // targetParent.add(ray5Helper);

          // // 向上 1 层
          // console.info('worldPosition - 1', worldPosition)
          // targetParent = targetParent.parent!
          // ray2Helper.setLength(55)
          // ray2Helper.setDirection(targetParent.worldToLocal(worldDirection))
          // ray2Helper.position.copy(targetParent.worldToLocal(worldPosition))
          // targetParent.add(ray2Helper);

          // // 向上 1 层
          // targetParent = targetParent.parent!
          // ray3Helper.setLength(60)
          // ray3Helper.setDirection(targetParent.worldToLocal(worldDirection))
          // ray3Helper.position.copy(targetParent.worldToLocal(worldPosition))
          // targetParent.add(ray3Helper);

          // // 向上 1 层
          // targetParent = targetParent.parent!
          // ray4Helper.setLength(65)
          // ray4Helper.setDirection(targetParent.worldToLocal(worldDirection))
          // ray4Helper.position.copy(targetParent.worldToLocal(worldPosition))
          // ray4Helper.copy(ray1Helper)
          // targetParent.add(ray4Helper);


        } else {
          console.warn('no eye', scene)
        }


        // GUI
        // const gui = new GUI()
        // gui.close()

        // const influences = (head as any).morphTargetInfluences;

        // for (const [key, value] of Object.entries((head as any).morphTargetDictionary)) {

        //   gui.add(influences, value as any, 0, 1, 0.01)
        //     .name(key.replace('blendShape1.', ''))
        //     .listen(influences);
        // }

        renderer.setAnimationLoop(animation);
      })

    // video 
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture, depthWrite: false });
    const videomesh = new THREE.Mesh(geometry, material);
    videomesh.position.z = -2
    // scene.add(videomesh);

    function animation() {
      const video = videoRef!
      const faceLandmarker = model()!.faceLandmarker
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {

        const results = faceLandmarker.detectForVideo(video, Date.now());

        if (results.facialTransformationMatrixes.length > 0) {

          const facialTransformationMatrixes = results.facialTransformationMatrixes[0].data;

          transform.matrix.fromArray(facialTransformationMatrixes);
          transform.matrix.decompose(transform.position, transform.quaternion, transform.scale);

          const object = scene.getObjectByName('grp_transform')!;

          // 视角

          object.position.x = -transform.position.x;
          object.position.y = transform.position.z;
          object.position.z = -transform.position.y;

          object.rotation.x = transform.rotation.x; // 俯仰
          object.rotation.y = -transform.rotation.z; // 歪头
          object.rotation.z = transform.rotation.y; // 扭头

          // object.position.x = transform.position.x;
          // object.position.y = transform.position.z;
          // object.position.z = - transform.position.y;

          // object.rotation.x = transform.rotation.x;
          // object.rotation.y = transform.rotation.z;
          // object.rotation.z = - transform.rotation.y;

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
            ray1Helper.getWorldPosition(rayOrigin)
            ray1Helper.getWorldDirection(rayDirection)


            ray1WorldHelper.position.copy(scene.worldToLocal(rayOrigin.clone()))

            ray1WorldHelper.setDirection(scene.worldToLocal(rayDirection.clone()))
            // const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
            const rayDup = new THREE.Ray(
              scene.worldToLocal(rayOrigin.clone()),
              scene.worldToLocal(rayDirection.clone()),
            );
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1));

            rayDup.intersectPlane(plane, intersectPoint);
            console.info('intersections', intersectPoint)
            setPoint({ x: intersectPoint.x, y: intersectPoint.y })
            sphere.position.copy(intersectPoint)
          } catch (error) {
            console.error('intersect fail', error, mbpCube, ray1)
          }

        }

        if (results.faceBlendshapes.length > 0) {

          const face = scene.getObjectByName('mesh_2')!;

          const faceBlendshapes = results.faceBlendshapes[0].categories;

          for (const blendshape of faceBlendshapes) {

            const categoryName = blendshape.categoryName;
            const score = blendshape.score;

            const index = (face as any).morphTargetDictionary[blendshapesMap[categoryName as keyof typeof blendshapesMap]];

            if (index !== undefined) {

              (face as any).morphTargetInfluences[index] = score;

            }

          }

        }

      }

      videomesh.scale.x = video.videoWidth / 100;
      videomesh.scale.y = video.videoHeight / 100;

      renderer.render(scene, camera);

      controls.update();

    }
  }

  function onResize() {
    setTimeout(() => {
      setWinSize({ w: window.screen.width, h: window.screen.height, sysBar: (window.screen as any)?.availTop || 0 })
      const deltaH = window.outerHeight - window.innerHeight
      const hasDevtoolY = deltaH > 100
      setBoundary({
        l: window.screenX,
        t_outer: window.screenY,
        t: window.screenY + (hasDevtoolY ? 79 : deltaH),
        w_outer: window.outerWidth,
        h_outer: window.outerHeight,
        w: window.innerWidth,
        h: window.innerHeight,
      })
    }, 10)
  }


  onMount(() => {
    console.info({ chrome })
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        console.log('切换到了后台标签页');
      } else {
        console.log('切换回了前台标签页');
      }
    });

    // 监听鼠标进入窗口
    document.documentElement.addEventListener('mouseenter', onResize);
    window.addEventListener('resize', onResize)

    onResize()

    return () => {
      window.removeEventListener('resize', onResize)
      document.documentElement.removeEventListener('mouseenter', onResize);
      if (THREE_renderer) {
        THREE_renderer.setAnimationLoop(null)
      }
      if (camEnabled()) {
        // 关闭摄像头
        videoStream()?.getTracks().forEach(track => {
          track.stop()
        })
        setVideoStream(undefined)
        setEnableCam(false)
      }

    }
  })
  return (
    <>
      <h1>Mediapipe Face Landmarks</h1>
      <p>Model Status: {model.state}</p>
      <div class={css.indicator} style={{
        width: `${winSize().w}px`,
        height: `${winSize().h}px`,
      }}>
        <div class={css.sysbar} style={{
          height: `${winSize().sysBar}px`
        }}>
        </div>
        <div class={css.browser} style={{
          left: `${boundary().l}px`,
          top: `${boundary().t_outer}px`,
          width: `${boundary().w_outer}px`,
          height: `${boundary().h_outer}px`,
        }}>
          {JSON.stringify(boundary())}
        </div>
        <div class={css.viewport} style={{
          left: `${boundary().l}px`,
          top: `${boundary().t}px`,
          width: `${boundary().w}px`,
          height: `${boundary().h}px`,
        }}>
        </div>
        <div class={css['eye-track-thumb']} style={{
          left: `${screenPoint().left}px`,
          top: `${screenPoint().top}px`,
        }}>
        </div>
      </div>
      <div class={css['eye-track']} style={{
        left: `${viewportPoint().left}px`,
        top: `${viewportPoint().top}px`,
      }}>
      </div>
      <Show when={model.state === 'ready'} fallback={
        <div>
          Loading Models {model.state}
        </div>
      }>
        <button disabled={isPending()}
          onClick={() => toggleCam()}>{camEnabled() ? 'Disable Cam' : 'Enable Cam'}</button>
        <hr />
        <div style="position: relative;display:grid;align-content:start">
          <video ref={videoRef} playsinline style={{ width: '320px', height: '240px', display: 'none' }}
            onLoadedData={() => {
              // predict()
              prepareThree()
            }}
          ></video>
          <canvas ref={canvasRef} style="position: absolute; left: 0px; top: 0px;"></canvas>
        </div>
        <canvas ref={threeRef} style={{ width: '640px', height: '480px' }}></canvas>
      </Show>
    </>
  )
}

export default App
