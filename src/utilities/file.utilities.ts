import JSZip from "jszip";

export function downloadFile(url: string) {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const zip = new JSZip();
      zip.loadAsync(blob).then((zip) => {
        for (const file of Object.entries(zip.files)) {
          // TODO Your code goes here
          console.log(file);
        }
      });
    });
}
