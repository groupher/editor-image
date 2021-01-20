import { loadJS, loadCSS, make } from "@groupher/editor-utils";
import GLightbox from "gLightbox";

import { STATUS } from "../constant";

// import interact from 'interactjs';
import ButtonIcon from "../icon/button-icon.svg";

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
export default class SingleImage {
  /**
   * @param {object} api - Editor.js API
   * @param {ImageConfig} config - user config
   * @param {function} onSelectFile - callback for clicks on Select file buttor
   */
  constructor({ api, data, config, onSelectFile, onStyleChange }) {
    this.api = api;
    this.i18n = config.i18n || "en";
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.onStyleChange = onStyleChange;

    this.imageUrl = "";

    this.initWidth = "100%";
    this.initHeight = "auto";

    this.nodes = {};
    this.initNodes(data);

    /**
     * image ratio, to keep image shape when resize
     */
    this.imageRatio = 1;

    /**
     * the lightbox for image preview
     */
    this.previewer = GLightbox();
  }

  /**
   * init html notes
   *
   * @memberof SingleImage
   */
  initNodes(data) {
    let caption = "";
    if (data.items[0]) {
      caption = data.items[0].desc || "";
    }

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
        innerHTML: caption,
      }),
    };
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
    };
  }

  /**
   * @param {ImageToolData} toolData
   * @return {HTMLDivElement}
   */
  render(toolData) {
    const url = toolData.items[0].src;
    console.log("render single: ", toolData);

    this.initNodes(toolData);
    this.fillImage(toolData.items[0]);

    return this.nodes.wrapper;
  }

  /**
   * Creates upload-file button
   * @return {Element}
   */
  createFileButton() {
    let button = make("div", [this.CSS.button]);
    const selectText = "本体上传";

    button.innerHTML =
      this.config.buttonContent || `${ButtonIcon} ${selectText}`;

    button.addEventListener("click", () => this.onSelectFile());

    return button;
  }

  /**
   * Shows uploading preloader
   * @param {string} src - preview source
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;

    this.toggleStatus(STATUS.UPLOADING);
  }

  /**
   * Hide uploading preloader
   */
  hidePreloader() {
    this.nodes.imagePreloader.style.backgroundImage = "";
    this.toggleStatus(STATUS.EMPTY);
  }

  /**
   * Shows an image
   * @param {ImageItem} item
   */
  fillImage(item) {
    const CSS = this.CSS;
    console.log(">> fill image: ", item);

    this.imageUrl = item.src;
    /**
     * Compose tag with defined attributes
     * @type {Element}
     */
    this.nodes.imageWrapper = make("DIV", CSS.imageWrapper);
    this.nodes.imageInfoLabel = make("DIV", CSS.imageInfoLabel);
    this.nodes.imageTopLeftDragger = make("DIV", CSS.imageTopLeftDragger);
    this.nodes.imageTopRightDragger = make("DIV", CSS.imageTopRightDragger);
    this.nodes.imageBottomLeftDragger = make("DIV", CSS.imageBottomLeftDragger);
    this.nodes.imageBottomRightDragger = make(
      "DIV",
      CSS.imageBottomRightDragger
    );
    this.nodes.imageEl = make("img", CSS.imageEl, { src: item.src });

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

    this.nodes.imageEl.addEventListener("click", () => {
      this.previewer.setElements([
        {
          href: item.src,
          type: "image",
          description: item.desc,
        },
      ]);
      this.previewer.open();
    });
  }

  /**
   * image on load handler
   * init resize handler inside
   */
  imageOnLoad() {
    loadJS(resizeScript, this.initResizeHandler.bind(this), document.body);

    this.toggleStatus(STATUS.FILLED);
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
    for (const statusType in STATUS) {
      if (STATUS.hasOwnProperty(statusType)) {
        this.nodes.wrapper.classList.toggle(
          `${this.CSS.wrapper}--${STATUS[statusType]}`,
          status === STATUS[statusType]
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