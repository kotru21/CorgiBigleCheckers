import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export function Renderer() {
  const { gl } = useThree();

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);

  return null;
}
