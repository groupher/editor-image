import ajax from "@codexteam/ajax";

/**
 * Module for file uploading. Handle 3 scenarios:
 *  1. Select file from device and upload
 *  2. Upload by pasting URL
 *  3. Upload by pasting file from Clipboard or by Drag'n'Drop
 */
export default class Uploader {
  /**
   * @param {ImageConfig} config
   * @param {function} onUpload - one callback for all uploading (file, url, d-n-d, pasting)
   * @param {function} onError - callback for uploading errors
   */
  constructor({ config, onUpload, onError }) {
    this.config = config;
    this.onUpload = onUpload;
    this.onError = onError;
  }

  /**
   * Handle clicks on the upload file button
   * @fires ajax.transport()
   * @param {function} onPreview - callback fired when preview is ready
   */
  uploadSelectedFile({ onPreview }) {
    const preparePreview = (file) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);
      reader.onload = (e) => {
        onPreview(e.target.result);
      };
    };

    /**
     * Custom uploading
     * or default uploading
     */
    let upload;

    // custom uploading
    if (
      this.config.uploader &&
      typeof this.config.uploader.uploadByFile === "function"
    ) {
      console.log("# custom uploading");
      return new Promise((resolve) => {
        // see @link: https://github.com/codex-team/ajax/blob/ecb65a9279aeffa0b578c57270aca1514138b70f/src/utils.js#L133-L139
        ajax
          .selectFiles({ multiple: true, accept: "image/*" })
          .then((files) => {
            console.log("select files: ", files);
            preparePreview(files[0]);

            const customUpload = this.config.uploader.uploadByFile(files);

            if (!isPromise(customUpload)) {
              console.warn(
                "Custom uploader method uploadByFile should return a Promise"
              );
            }

            customUpload.then((files) => {
              return resolve(files);
            });
          });
      });
    }
  }

  /**
   * Handle clicks on the upload file button
   * @fires ajax.post()
   * @param {string} url - image source url
   */
  uploadByUrl(url) {
    let upload;

    /**
     * Custom uploading
     */
    if (
      this.config.uploader &&
      typeof this.config.uploader.uploadByUrl === "function"
    ) {
      upload = this.config.uploader.uploadByUrl(url);

      if (!isPromise(upload)) {
        console.warn(
          "Custom uploader method uploadByUrl should return a Promise"
        );
      }
    } else {
      /**
       * Default uploading
       */
      upload = ajax
        .post({
          url: this.config.endpoints.byUrl,
          data: Object.assign(
            {
              url: url,
            },
            this.config.additionalRequestData
          ),
          type: ajax.contentType.JSON,
          headers: this.config.additionalRequestHeaders,
        })
        .then((response) => response.body);
    }

    upload
      .then((response) => {
        this.onUpload(response);
      })
      .catch((error) => {
        this.onError(error);
      });
  }

  /**
   * Handle clicks on the upload file button
   * @fires ajax.post()
   * @param {File} file - file pasted by drag-n-drop
   * @param {function} onPreview - file pasted by drag-n-drop
   */
  uploadByFile(file, { onPreview }) {
    /**
     * Load file for preview
     * @type {FileReader}
     */
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (e) => {
      onPreview(e.target.result);
    };

    let upload;

    /**
     * Custom uploading
     */
    if (
      this.config.uploader &&
      typeof this.config.uploader.uploadByFile === "function"
    ) {
      upload = this.config.uploader.uploadByFile(file);

      if (!isPromise(upload)) {
        console.warn(
          "Custom uploader method uploadByFile should return a Promise"
        );
      }
    } else {
      /**
       * Default uploading
       */
      const formData = new FormData();

      formData.append(this.config.field, file);

      if (
        this.config.additionalRequestData &&
        Object.keys(this.config.additionalRequestData).length
      ) {
        Object.entries(this.config.additionalRequestData).forEach(
          ([name, value]) => {
            formData.append(name, value);
          }
        );
      }

      upload = ajax
        .post({
          url: this.config.endpoints.byFile,
          data: formData,
          type: ajax.contentType.JSON,
          headers: this.config.additionalRequestHeaders,
        })
        .then((response) => response.body);
    }

    upload
      .then((response) => {
        this.onUpload(response);
      })
      .catch((error) => {
        this.onError(error);
      });
  }
}

/**
 * Check if passed object is a Promise
 * @param  {*}  object - object to check
 * @return {Boolean}
 */
function isPromise(object) {
  return Promise.resolve(object) === object;
}
