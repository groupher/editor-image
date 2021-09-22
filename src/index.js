/**
 * Image Tool for the Editor.js
 * @author CodeX <team@ifmo.su>
 * @license MIT
 * @see {@link https://github.com/groupher/editor-image}
 *
 * To developers.
 * To simplify Tool structure, we split it to 4 parts:
 *  1) index.js — main Tool's interface, public API and methods for working with data
 *  2) uploader.js — module that has methods for sending files via AJAX: from device, by URL or File pasting
 *  3) ui.js — module for UI manipulations: render, showing preloader, etc
 *
 * For debug purposes there is a testing server
 * that can save uploaded files and return a Response {@link UploadResponseFormat}
 *
 *       $ node dev/server.js
 *
 * It will expose 8008 port, so you can pass http://localhost:8008 with the Tools config:
 *
 * image: {
 *   class: ImageTool,
 *   config: {
 *     endpoints: {
 *       byFile: 'http://localhost:8008/uploadFile',
 *       byUrl: 'http://localhost:8008/fetchUrl',
 *     }
 *   },
 * },
 */

/**
 * @typedef {object} ImageToolData
 * @description Image Tool's input and output data format
 * @property {string} caption — image caption
 * @property {boolean} withBorder - should image be rendered with border
 * @property {boolean} withBackground - should image be rendered with background
 * @property {boolean} stretched - should image be stretched to full width of container
 * @property {object} file — Image file data returned from backend
 * @property {string} file.url — image URL
 */

import { debounce } from "@groupher/editor-utils";

// eslint-disable-next-line
import css from "./styles/index.css";
import UI from "./ui";
import ToolboxIcon from "./icon/toolbox.svg";
import Uploader from "./uploader";

import { TMP_PIC } from "./constant";

/**
 * @typedef {object} ImageConfig
 * @description Config supported by Tool
 * @property {object} endpoints - upload endpoints
 * @property {string} endpoints.byFile - upload by file
 * @property {string} endpoints.byUrl - upload by URL
 * @property {string} field - field name for uploaded image
 * @property {string} types - available mime-types
 * @property {string} captionPlaceholder - placeholder for Caption field
 * @property {object} additionalRequestData - any data to send with requests
 * @property {object} additionalRequestHeaders - allows to pass custom headers with Request
 * @property {string} buttonContent - overrides for Select File button
 * @property {object} [uploader] - optional custom uploader
 * @property {function(File): Promise.<UploadResponseFormat>} [uploader.uploadByFile] - method that upload image by File
 * @property {function(string): Promise.<UploadResponseFormat>} [uploader.uploadByUrl] - method that upload image by URL
 */

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on file uploading
 * @property {number} success - 1 for successful uploading, 0 for failure
 * @property {object} file - Object with file data.
 *                           'url' is required,
 *                           also can contain any additional data that will be saved and passed back
 * @property {string} file.url - [Required] image source URL
 */
export default class ImageTool {
  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: ToolboxIcon,
      title: "图片（集）",
    };
  }

  /**
   * @param {ImageToolData} data - previously saved data
   * @param {ImageConfig} config - user config for Tool
   * @param {object} api - Editor.js API
   */
  constructor({ data, config, api }) {
    this.api = api;
    this.i18n = config.i18n || "en";

    /**
     * Tool's initial config
     */
    this.config = {
      endpoints: config.endpoints || "",
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || "image",
      types: config.types || "image/*",
      captionPlaceholder: "图片描述",
      buttonContent: config.buttonContent || "",
      // uploader: config.uploader || undefined,
      uploader: {
        uploadByFile: (files) => {
          this.ui.triggerHint(true);
          return new Promise((resolve) => {
            setTimeout(() => {
              this.ui.triggerHint(false);
              resolve(files);
            }, 3000);
          });
        },
      },
      i18n: config.i18n || "en",
    };

    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(),
    });

    this._data = {
      mode: "single", // "jiugongge",
      items: [],
    };

    for (let i = 0; i < 8; i++) {
      this._data.items.push({
        index: i,
        src: TMP_PIC[i],
        caption: i === 0 ? "我是一条描述信息，这是我的尾巴" : "",
        width: "368px",
        height: "552px",
      });
    }
    this._data.mode = "single";

    /**
     * Module for working with UI
     */
    this.ui = new UI({
      api,
      config: this.config,
      data: this._data,
      reRender: this.reRender.bind(this),
      onSelectFile: () => {
        this.uploader
          .uploadSelectedFile({
            onPreview: (src) => {
              this.ui.triggerHint(true);
            },
          })
          .then((files) => {
            console.log("> uploadSelectedFile files: ", files);
            this.ui.triggerHint(false);

            this.onUpload({
              success: 1,
              file: {
                url: "https://rmt.dogedoge.com/fetch/~/source/unsplash/photo-1607332292931-c15ec25909b0?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=647&q=80",
              },
            });
          });
      },
    });

    /**
     * Set saved state
     */
    // this._data = {
    //   file: {
    //     url: TMP_PIC,
    //   },
    // };

    this.element = null;
  }

  /**
   * Renders Block content
   * @public
   *
   * @return {HTMLDivElement}
   */
  render() {
    this.element = this.ui.render(this._data);

    return this.element;
  }

  /**
   * @param {ImageToolData} toolData
   */
  reRender(data) {
    this._data = data;
    this.replaceElement(this.ui.render(this._data));
  }

  /**
   * replace element wrapper with new html element
   * @param {HTMLElement} node
   */
  replaceElement(node) {
    this.element.replaceWith(node);
    this.element = node;

    this.api.tooltip.hide();
    this.api.toolbar.close();
  }

  /**
   * Renders Settings panel
   * @public
   *
   * @return {HTMLDivElement}
   */
  renderSettings() {
    return this.ui.renderSettings(this._data);
  }

  /**
   * Fires after clicks on the Toolbox Image Icon
   * Initiates click on the Select File button
   * @public
   */
  appendCallback() {
    this.ui.nodes.fileButton.click();
  }

  /**
   * Specify paste substitutes
   *
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   */
  static get pasteConfig() {
    return {
      /**
       * Paste HTML into Editor
       */
      tags: ["img"],

      /**
       * Paste URL of image into the Editor
       */
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png)$/i,
      },

      /**
       * Drag n drop file from into the Editor
       */
      files: {
        mimeTypes: ["image/*"],
      },
    };
  }

  /**
   * Specify paste handlers
   * @public
   *
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   */
  async onPaste(event) {
    switch (event.type) {
      case "tag":
        const image = event.detail.data;

        /** Images from PDF */
        if (/^blob:/.test(image.src)) {
          const response = await fetch(image.src);
          const file = await response.blob();

          console.log("onPaste 0");
          this.uploadFile(file);
          break;
        }

        console.log("onPaste 1");
        this.uploadUrl(image.src);
        break;

      case "pattern":
        const url = event.detail.data;

        console.log("onPaste 2");
        this.uploadUrl(url);
        break;

      case "file":
        const file = event.detail.file;

        console.log("onPaste 3: ", file);
        this.uploadFile(file);
        break;
    }
  }

  /**
   * Private methods
   * ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿
   */

  /**
   * Stores all Tool's data
   * @private
   *
   * @param {ImageToolData} data
   */
  set data(data) {
    this.image = this._data.file;

    this._data.caption = this._data.caption || "";
    this.ui.fillCaption(this._data.caption);
  }

  /**
   * Return Tool data
   * @private
   *
   * @return {ImageToolData} data
   */
  get data() {
    return this.ui.data;
  }

  /**
   * Return Block data
   * @public
   *
   * @return {TableData}
   */
  save() {
    // console.log("# image saving: ", this.ui.data);
    return this.ui.data;
  }

  /**
   * Set new image file
   * @private
   *
   * @param {object} file - uploaded file data
   */
  // set image(file) {
  //   this._data.file = file || {};

  //   if (file && file.url) {
  //     this.ui.fillImage(file.url);
  //   }
  // }

  /**
   * File uploading callback
   * @private
   *
   * @param {UploadResponseFormat} response
   */
  onUpload(response) {
    console.log("# current data:: ", this._data);
    console.log("the onUpload response: ", response);

    if (response.success && response.file) {
      // this.image = response.file;
      // this.image = response.file;
      this._data.items.push({
        src: response.file.url,
      });

      this.reRender(this._data);
    } else {
      this.uploadingFailed();
    }
  }

  /**
   * Handle uploader errors
   * @private
   */
  uploadingFailed() {
    this.ui.triggerHint(true, "error");
    setTimeout(() => {
      this.ui.triggerHint(false);
    }, 5000);
  }

  /**
   * Show preloader and upload image file
   *
   * @param {File} file
   */
  uploadFile(file) {
    this.config.uploader.uploadByFile(file).then((files) => {
      this.onUpload({
        success: 1,
        file: {
          url: "https://rmt.dogedoge.com/fetch/~/source/unsplash/photo-1607332292931-c15ec25909b0?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=647&q=80",
        },
      });
    });
  }

  /**
   * Show preloader and upload image by target url
   *
   * @param {string} url
   */
  uploadUrl(url) {
    // this.ui.showPreloader(url);
    this.uploader.uploadByUrl(url);
  }
}
