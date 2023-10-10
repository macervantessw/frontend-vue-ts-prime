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
