import JSZip from "jszip";

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
  const samplingRate = file.slice(4, 8).reduce((acc, curr, index) => {
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
  return data;
}

export async function getData(files: Record<string, JSZip.JSZipObject>, timeAxis: number[], fileName: string, invertValues = false) {
  const dataUnzipped = await files[fileName].async("uint8array");
  let data = readDatFile(dataUnzipped);
  data = data.filter((_e, index) => index % 3 === 0);
  return timeAxis.map((element, index) => {
    return { time: element, value: invertValues ? data[index] * -1 : data[index] };
  });
}

export async function getAverage(files: Record<string, JSZip.JSZipObject>, fileName: string) {
  const dataUnzipped = await files[fileName].async("uint8array");
  const data = readDatFile(dataUnzipped);
  return data.reduce((acc, curr) => acc + curr, 0) / data.length;
}
