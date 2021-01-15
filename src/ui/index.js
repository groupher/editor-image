import { loadJS, loadCSS, make } from "@groupher/editor-utils";
// import interact from 'interactjs';
import ButtonIcon from "../icon/button-icon.svg";

import SingleIcon from "../icon/single.svg";
import GalleryIcon from "../icon/gallery.svg";
import JiugonggeIcon from "../icon/jiugongge.svg";

import { TMP_PIC, MODE } from "../constant";

import Jiugongge from "./jiugongge";
import Gallery from "./gallery";

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
  constructor({ api, config, onSelectFile, onStyleChange, reRender }) {
    this.api = api;
    this.i18n = config.i18n || "en";
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.onStyleChange = onStyleChange;
    this.reRender = reRender;

    this.imageUrl = "";

    this.initWidth = "100%";
    this.initHeight = "auto";

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
      fileButton: undefined, // this.createFileButton(),
      imageWrapper: undefined,
      imageTopLeftDragger: undefined,
      imageTopRightDragger: undefined,
      imageInfoLabel: undefined,
      imageBottomLeftDragger: undefined,
      imageBottomRightDragger: undefined,
      imageEl: undefined,
      imagePreloader: make("div", this.CSS.imagePreloader),
      caption: make("div", [this.CSS.input, this.CSS.caption], {
        contentEditable: true,
      }),
      downloadLinkEl: make("a", ["hello"], {
        href: "",
        target: "_blank",
        download: true,
        rel: "noreferrer",
      }),
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
     *    <caption />
     *    <select-file-button />
     *  </wrapper>
     */
    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);
    this.nodes.wrapper.appendChild(this.nodes.caption);
    //
    // this.nodes.wrapper.appendChild(this.nodes.fileButton);

    //
    this.jiugonge = new Jiugongge({
      api,
      reRender: reRender,
    });
    this.gallery = new Gallery({
      api,
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
      imageContainer: "image-tool__image",
      imagePreloader: "image-tool__image-preloader",
      imageWrapper: "image-tool__image-wrapper",
      imageInfoLabel: "image-tool__image-wrapper-infolabel",
      imageTopLeftDragger: "image-tool__image-wrapper-topleft-dragger",
      imageTopRightDragger: "image-tool__image-wrapper-topright-dragger",
      imageBottomLeftDragger: "image-tool__image-wrapper-bottomleft-dragger",
      imageBottomRightDragger: "image-tool__image-wrapper-bottomright-dragger",
      imageEl: "image-tool__image-picture",
      caption: "image-tool__caption",

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
    this._data = toolData;

    switch (toolData.mode) {
      case MODE.JIUGONGGE: {
        return this.jiugonge.render(toolData);
      }
      case MODE.GALLERY: {
        return this.gallery.render(toolData);
      }
      default: {
        return this.jiugonge.render(toolData);
      }
    }
  }

  // /**
  //  * @param {ImageToolData} toolData
  //  */
  // reRender(toolData) {
  //   return;
  // }

  /**
   * @param {ImageToolData} toolData
   * @return {HTMLDivElement}
   */
  renderBak(toolData) {
    if (!toolData.file || Object.keys(toolData.file).length === 0) {
      this.toggleStatus(UI.status.EMPTY);
    } else {
      // this.toggleStatus(UI.status.UPLOADING);
      this.toggleStatus(UI.status.FILLED);
      this.fillImage(toolData.file.url);
    }

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

    wrapper.appendChild(this.nodes.downloadLinkEl);
    return wrapper;
  }

  /**
   * handle image settings
   * @return {Boolean}
   */
  handleSettingAction(setting) {
    this.api.toolbar.close();

    if (setting.raw === MODE.SINGLE) {
      console.log("TODO");
      return false;
    }

    this._data.mode = setting.raw;

    if (setting.raw === MODE.JIUGONGGE) {
      console.log("MODE.JIUGONGGE");
      this.reRender(this._data);
    }
    if (setting.raw === MODE.GALLERY) {
      console.log("MODE.GALLERY");
      this.reRender(this._data);
    }

    return false;
  }

  /**
   * handle image reset to full size
   * @return {Boolean}
   */
  handleSettingActionReset() {
    this.nodes.imageWrapper.style.width = this.initWidth;
    this.nodes.imageWrapper.style.height = this.initHeight;

    this.onStyleChange({
      width: this.initWidth,
      height: this.initHeight,
    });

    this.api.toolbar.close();
    return false;
  }

  /**
   * Creates upload-file button
   * @return {Element}
   */
  createFileButton() {
    let button = make("div", [this.CSS.button]);
    const selectText = "选择图片";

    button.innerHTML =
      this.config.buttonContent || `${ButtonIcon} ${selectText}`;

    button.addEventListener("click", () => {
      console.log("clicked fuck");
      this.onSelectFile();
    });

    return button;
  }

  /**
   * Shows uploading preloader
   * @param {string} src - preview source
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;

    this.toggleStatus(UI.status.UPLOADING);
  }

  /**
   * Hide uploading preloader
   */
  hidePreloader() {
    this.nodes.imagePreloader.style.backgroundImage = "";
    this.toggleStatus(UI.status.EMPTY);
  }

  /**
   * Shows an image
   * @param {string} url
   */
  fillImage(url) {
    /**
     * Check for a source extension to compose element correctly: video tag for mp4, img — for others
     */
    const tag = "IMG";

    let attributes = {
      src: url,
    };

    this.imageUrl = url;
    /**
     * Compose tag with defined attributes
     * @type {Element}
     */
    this.nodes.imageWrapper = make("DIV", this.CSS.imageWrapper, {});
    this.nodes.imageInfoLabel = make("DIV", this.CSS.imageInfoLabel, {});
    this.nodes.imageTopLeftDragger = make(
      "DIV",
      this.CSS.imageTopLeftDragger,
      {}
    );
    this.nodes.imageTopRightDragger = make(
      "DIV",
      this.CSS.imageTopRightDragger,
      {}
    );
    this.nodes.imageBottomLeftDragger = make(
      "DIV",
      this.CSS.imageBottomLeftDragger,
      {}
    );
    this.nodes.imageBottomRightDragger = make(
      "DIV",
      this.CSS.imageBottomRightDragger,
      {}
    );
    this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes);

    /**
     * Add load event listener
     */
    this.nodes.imageEl.addEventListener("load", this.imageOnLoad.bind(this));

    /**
     * Add resize event listener
     */
    this.nodes.imageWrapper.appendChild(this.nodes.imageTopLeftDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageInfoLabel);
    this.nodes.imageWrapper.appendChild(this.nodes.imageTopRightDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageBottomLeftDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageBottomRightDragger);
    this.nodes.imageWrapper.appendChild(this.nodes.imageEl);
    this.nodes.imageContainer.appendChild(this.nodes.imageWrapper);
    // this.nodes.imageContainer.appendChild(this.nodes.imageEl);
  }

  /**
   * image on load handler
   * init resize handler inside
   */
  imageOnLoad() {
    loadJS(resizeScript, this.initResizeHandler.bind(this), document.body);

    this.toggleStatus(UI.status.FILLED);
    // eslint-disable-next-line no-undef

    /**
     * Preloader does not exists on first rendering with presaved data
     */
    if (this.nodes.imagePreloader) {
      this.nodes.imagePreloader.style.backgroundImage = "";
    }
  }

  /**
   * resize the picture
   */
  initResizeHandler() {
    this.imageRatio = this.nodes.imageEl.height / this.nodes.imageEl.width;
    let labelInfoTimer = null;

    // eslint-disable-next-line no-undef
    // interact(this.nodes.imageEl)
    interact(this.nodes.imageWrapper)
      .resizable({
        edges: {
          top: true, // Use pointer coords to check for resize.
          left: true, // Disable resizing from left edge.
          bottom: true, // Resize if pointer target matches selector
          right: true,
        },
      })
      .on("resizestart", () => {
        this.nodes.imageEl.style.opacity = 0.9;
        if (labelInfoTimer) clearTimeout(labelInfoTimer);
        this.nodes.imageInfoLabel.style.opacity = 1;
      })
      .on("resizeend", (event) => {
        this.nodes.imageEl.style.opacity = 1;
        labelInfoTimer = setTimeout(() => {
          this.nodes.imageInfoLabel.style.opacity = 0;
        }, 500);
        event.stopPropagation();
      })
      .on("resizemove", (event) => {
        let { x, y } = event.target.dataset;
        const maxWidth = event.target.parentElement.parentElement.clientWidth;

        x = parseFloat(x) || 0;
        y = parseFloat(y) || 0;

        // TODO:  先要看是竖的还是横的
        // const radio = event.target.height / event.target.width

        const dragWidth =
          event.rect.width <= maxWidth ? event.rect.width : maxWidth;
        const dragHeight = dragWidth * this.imageRatio;

        this.nodes.imageInfoLabel.innerHTML = this.labelInfoHTML(
          dragHeight,
          dragWidth
        );

        // `h: ${parseInt(dragHeight)} px / w: ${parseInt(dragWidth)} px`
        Object.assign(event.target.style, {
          width: `${dragWidth}px`,
          height: `${dragHeight}px`,
          transform: `translate(${event.deltaRect.left}px, ${event.deltaRect.top}px)`,
        });

        this.onStyleChange({
          width: dragWidth,
          height: dragHeight,
        });

        Object.assign(event.target.dataset, { x, y });
      });
  }

  /**
   * labelInfoHTML pices
   * @param {string} height - current drag height of the image
   * @param {string} width - current drag width of the image
   */
  labelInfoHTML(height, width) {
    return (
      '<span class="opacity-08">h:&nbsp;</span>' +
      parseInt(height) +
      '<span class="opacity-08">&nbsp;px</span>' +
      "&nbsp;&nbsp;/&nbsp;&nbsp;" +
      '<span class="opacity-08">w:&nbsp;</span>' +
      parseInt(width) +
      '<span class="opacity-08">&nbsp;px</span>'
    );
  }

  /**
   * Shows caption input
   * @param {string} text - caption text
   */
  fillCaption(text) {
    if (this.nodes.caption) {
      this.nodes.caption.innerHTML = text;
    }
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
}
