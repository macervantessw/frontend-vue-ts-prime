import JSZip from "jszip";
import { DOWNSAMPLE_RATIO } from "../constants";

export function downloadFile(url: string) {
  //fetch with no-cors header
  fetch(url, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = url.split("/").pop() || "";
      link.click();
    })
    .catch((error) => {
      console.error(error);
    });
}

export async function uncompressFile(fileBlob: Blob) {
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(fileBlob);
  return zip.files;
}

export function readDatFile(file: Uint8Array): number[] {
  //Take bytes from 4 to 8 and convert to int
  /*const samplingRate = file.slice(4, 8).reduce((acc, curr, index) => {
    return acc + curr * Math.pow(256, index);
  }, 0);

  //iterate over the rest of the file and convert to int
  const data = [];
  for (let i = 8; i < file.length; i += samplingRate) {
    const sample = file.slice(i, i + samplingRate).reduce((acc, curr, index) => {
      return acc + curr * Math.pow(256, index);
    }, 0);
    data.push(sample);
  }
  return data;*/
  return readDatFileGeneric(file, { signed: false });

}

export function readDatFileGeneric(file: Uint8Array, opts?: { signed?: boolean }) {
  const dv = new DataView(file.buffer, file.byteOffset, file.byteLength);

  // ⚠️ Abans anomenaves això 'samplingRate', però s'està usant com a mida de mostra.
  const sampleSizeBytes = dv.getUint32(4, true); // little-endian
  const data: number[] = [];

  const readSample = (byteOffset: number): number => {
    switch (sampleSizeBytes) {
      case 1:
        return opts?.signed ? dv.getInt8(byteOffset) : dv.getUint8(byteOffset);
      case 2:
        return opts?.signed ? dv.getInt16(byteOffset, true) : dv.getUint16(byteOffset, true);
      case 4:
        return opts?.signed ? dv.getInt32(byteOffset, true) : dv.getUint32(byteOffset, true);
      default: {
        // fallback: agrega els bytes (com feies) per no petar si el format és rar.
        let acc = 0;
        for (let i = 0; i < sampleSizeBytes; i++) acc += dv.getUint8(byteOffset + i) * Math.pow(256, i);
        return acc;
      }
    }
  };

  for (let i = 8; i + sampleSizeBytes <= file.length; i += sampleSizeBytes) {
    data.push(readSample(i));
  }
  return data;
}


export async function getData(
  files: Record<string, JSZip.JSZipObject>,
  timeAxis: number[],
  fileName: string,
  invertValues = false,
  opts?: { signed?: boolean; removeMean?: boolean }
) {
  const dataUnzipped = await files[fileName].async("uint8array");
  let data: number[] = [];
  try {
    data = readDatFileGeneric(dataUnzipped, { signed: !!opts?.signed });
  } catch {
    return [];
  }

  if (opts?.removeMean) {
    const mean = data.reduce((a, b) => a + b, 0) / (data.length || 1);
    data = data.map((v) => v - mean);
  }

  // downsample
  const ds = data.filter((_e, index) => index % DOWNSAMPLE_RATIO === 0);

  const n = Math.min(timeAxis.length, ds.length);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const v = invertValues ? -ds[i] : ds[i];
    out[i] = { time: timeAxis[i], value: v };
  }
  return out;
}

export async function getAverage(files: Record<string, JSZip.JSZipObject>, fileName: string, opts?: { signed?: boolean }) {
  const dataUnzipped = await files[fileName].async("uint8array");
  const data = readDatFileGeneric(dataUnzipped, { signed: !!opts?.signed });
  return data.reduce((acc, curr) => acc + curr, 0) / (data.length || 1);
}
