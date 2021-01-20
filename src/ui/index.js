import { loadJS, loadCSS, make } from "@groupher/editor-utils";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

// import interact from 'interactjs';
import UploadIcon from "../icon/upload.svg";
import LinkIcon from "../icon/link-add.svg";

import SingleIcon from "../icon/single.svg";
import GalleryIcon from "../icon/gallery.svg";
import JiugonggeIcon from "../icon/jiugongge.svg";

import { TMP_PIC, MODE } from "../constant";

import SingleImage from "./single_image";
import JiugonggeImages from "./jiugongge_images";
import GalleryImages from "./gallery_images";

import { getExternalLinkPopoverOptions } from "./helper";

/**
 * @typedef {Object} ImageToolData
 * @description Table Tool's  data format
 * @property {number} columnCount — column count
 * @property {String} mode - single | jiugongge | gallery
 * @property {[ImageItem]} items - array of cell item
 */

/**
 * @typedef {Object} ImageItem
 * @description image item
 * @property {String} src - image src link address
 * @property {String} desc
 * @property {String} width
 * @property {String} height
 */

const resizeScript =
  "https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js";

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class UI {
  /**
   * @param {object} api - Editor.js API
   * @param {ImageConfig} config - user config
   * @param {function} onSelectFile - callback for clicks on Select file buttor
   */
  constructor({ api, config, data, onSelectFile, onStyleChange, reRender }) {
    this.api = api;
    this.i18n = config.i18n || "en";
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.onStyleChange = onStyleChange;
    this.reRender = reRender;

    this.imageUrl = "";

    this.initWidth = "100%";
    this.initHeight = "auto";

    this._data = data;
    this.settings = [
      {
        raw: MODE.SINGLE,
        title: "单张模式",
        icon: SingleIcon,
      },
      {
        raw: MODE.JIUGONGGE,
        title: "九宫格模式",
        icon: JiugonggeIcon,
      },
      {
        raw: MODE.GALLERY,
        title: "画廊模式",
        icon: GalleryIcon,
      },
    ];

    this.nodes = {
      wrapper: make("div", [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make("div", [this.CSS.imageContainer]),
      fileButton: undefined,
      imageWrapper: undefined,
      imagePreloader: make("div", this.CSS.imagePreloader),
    };

    /**
     * image ratio, to keep image shape when resize
     */
    this.imageRatio = 1;

    /**
     * Create base structure
     *  <wrapper>
     *    <image-container>
     *      <image-preloader />
     *    </image-container>
     *    <select-file-button />
     *  </wrapper>
     */
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);
    //
    this.nodes.fileButton = this.createUploadButton(this._data);
    this.nodes.wrapper.appendChild(this.nodes.fileButton);

    //
    this.singleImage = new SingleImage({
      api,
      data,
      config,
      onSelectFile,
      onStyleChange,
    });
    this.jiugongeImages = new JiugonggeImages({
      api,
      data,
      reRender: reRender,
    });
    this.galleryImages = new GalleryImages({
      api,
      data,
      reRender: reRender,
    });
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: "image-tool",
      mainUploadBox: "image-tool__main_upload_box",
      mainUploadBoxIcon: "image-tool__main_upload_box_icon",
      mainUploadBoxIconSmall: "image-tool__main_upload_box_icon_small",
      mainUploadInfo: "image-tool__main_upload_box_info",
      mainUploadButton: "image-tool__main_upload_box_button",
      mainUploadButtonTitle: "image-tool__main_upload_box_button_title",
      mainUploadButtonDesc: "image-tool__main_upload_box_button_desc",

      imageContainer: "image-tool__image",
      imagePreloader: "image-tool__image-preloader",
      imageWrapper: "image-tool__image-wrapper",

      settingsWrapper: "cdx-settings-panel",
      settingsButton: this.api.styles.settingsButton,
      settingsButtonActive: this.api.styles.settingsButtonActive,
    };
  }

  /**
   * UI statuses:
   * - empty
   * - uploading
   * - filled
   * @return {{EMPTY: string, UPLOADING: string, FILLED: string}}
   */
  static get status() {
    return {
      EMPTY: "empty",
      UPLOADING: "loading",
      FILLED: "filled",
    };
  }

  /**
   * @param {ImageToolData} toolData
   * @return {HTMLDivElement}
   */
  render(toolData) {
    // if given images data is empty, render upload options
    if (!toolData.items || toolData.items.length === 0) {
      return this.renderUploadOptions(toolData);
    }

    this._data = toolData;

    switch (toolData.mode) {
      case MODE.JIUGONGGE: {
        return this.jiugongeImages.render(toolData);
      }
      case MODE.GALLERY: {
        return this.galleryImages.render(toolData);
      }
      default: {
        return this.singleImage.render(toolData);
      }
    }
  }

  /**
   * render upload options, upload-local or external-link
   * @param {ImageToolData} toolData
   * @return {HTMLDivElement}
   */
  renderUploadOptions(toolData) {
    this._data = toolData;

    this.toggleStatus(UI.status.EMPTY);
    // if (!toolData.file || Object.keys(toolData.file).length === 0) {
    //   console.log("b2");
    //   this.toggleStatus(UI.status.EMPTY);
    // } else {
    //   console.log("b3");
    //   // this.toggleStatus(UI.status.UPLOADING);
    //   this.toggleStatus(UI.status.FILLED);
    //   this.fillImage(toolData.file.url);
    // }

    // this.toggleStatus(UI.status.FILLED);
    // this.fillImage(toolData.file.url);

    return this.nodes.wrapper;
  }

  /**
   * Renders Settings panel
   * @public
   *
   * @return {HTMLDivElement}
   */
  renderSettings(data) {
    const wrapper = make("div", [this.CSS.settingsWrapper], {});

    this.settings.forEach((item) => {
      const itemEl = make("div", [this.CSS.settingsButton], {
        title: item.title,
        innerHTML: item.icon,
      });

      itemEl.addEventListener("click", () => this.handleSettingAction(item));
      this.api.tooltip.onHover(itemEl, item.title, {
        delay: 200,
        placement: "top",
      });

      if (data.mode === item.raw) {
        itemEl.classList.add(this.CSS.settingsButtonActive);
      }

      wrapper.appendChild(itemEl);
    });

    return wrapper;
  }

  /**
   * handle image settings
   * @return {Boolean}
   */
  handleSettingAction(setting) {
    this.api.toolbar.close();
    this._data.mode = setting.raw;
    this.reRender(this._data);

    return false;
  }

  /**
   * Creates upload-file button
   * @return {Element}
   */
  createUploadButton(data) {
    const WrapperEl = make("div", [this.CSS.mainUploadBox, this.CSS.button]);
    const UploadDesIcon = make("div", this.CSS.mainUploadBoxIcon, {
      innerHTML: UploadIcon,
    });

    const UploadButtonEl = make("div", [this.CSS.mainUploadButton]);

    const UploadInfoEl = make("div", [this.CSS.mainUploadInfo]);
    const UploadTitleEl = make("div", [this.CSS.mainUploadButtonTitle], {
      innerHTML: "本地上传",
    });
    const UploadDescEl = make("div", [this.CSS.mainUploadButtonDesc], {
      innerHTML: "jpg, png, gif 等常见格式, 最大 500 KB",
    });

    UploadInfoEl.appendChild(UploadTitleEl);
    UploadInfoEl.appendChild(UploadDescEl);

    UploadButtonEl.appendChild(UploadDesIcon);
    UploadButtonEl.appendChild(UploadInfoEl);

    const LinkDesIcon = make("div", this.CSS.mainUploadBoxIconSmall, {
      innerHTML: LinkIcon,
    });
    const LinkButtonEl = make("div", [this.CSS.mainUploadButton]);

    const LinkInfoEl = make("div", [this.CSS.mainUploadInfo]);
    const LinkTitleEl = make("div", [this.CSS.mainUploadButtonTitle], {
      innerHTML: "外部链接",
    });
    const LinkDescEl = make("div", [this.CSS.mainUploadButtonDesc], {
      innerHTML: "外部图片链接地址",
    });

    LinkInfoEl.appendChild(LinkTitleEl);
    LinkInfoEl.appendChild(LinkDescEl);

    LinkButtonEl.appendChild(LinkDesIcon);
    LinkButtonEl.appendChild(LinkInfoEl);

    tippy(
      LinkButtonEl,
      getExternalLinkPopoverOptions(data, 0, (data) => this.reRender(data))
    );

    WrapperEl.appendChild(UploadButtonEl);
    WrapperEl.appendChild(LinkButtonEl);

    UploadButtonEl.addEventListener("click", () => this.onSelectFile());

    return WrapperEl;
  }

  /**
   * Changes UI status
   * @param {string} status - see {@link UI.status} constants
   */
  toggleStatus(status) {
    for (const statusType in UI.status) {
      if (UI.status.hasOwnProperty(statusType)) {
        this.nodes.wrapper.classList.toggle(
          `${this.CSS.wrapper}--${UI.status[statusType]}`,
          status === UI.status[statusType]
        );
      }
    }
  }

  /**
   * Apply visual representation of activated tune
   * @param {string} tuneName - one of available tunes {@link Tunes.tunes}
   * @param {boolean} status - true for enable, false for disable
   */
  applyTune(tuneName, status) {
    this.nodes.wrapper.classList.toggle(
      `${this.CSS.wrapper}--${tuneName}`,
      status
    );
  }

  /**
   * saving data
   *
   * @readonly
   * @memberof UI
   */
  get data() {
    return this._data;
  }
}
