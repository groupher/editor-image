import { make, swapArrayItems, clazz } from "@groupher/editor-utils";
import GLightbox from "gLightbox";

import tippy, { hideAll } from "tippy.js";

import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

// eslint-disable-next-line
import glightboxCss from "glightbox/dist/css/glightbox.min.css";

import { remove } from "ramda";

// eslint-disable-next-line
import css from "../styles/gallery.css";
import UploadIcon from "../icon/upload.svg";
import LinkAddIcon from "../icon/link-add.svg";

import PenIcon from "../icon/pen.svg";
import DeleteIcon from "../icon/delete.svg";

import { getExternalLinkPopoverOptions } from "./helper";
import { TMP_PIC } from "../constant";

/**
 * Class for working with Gallery UI:
 *  - rendering pictures with gallery style
 *  - add notes / drag position etc..
 *  - apply tune view
 */
export default class GalleryImages {
  /**
   * @param {object} api - Editor.js API
   */
  constructor({ api, data, onSelectFile, reRender }) {
    this.api = api;
    this.reRender = reRender;
    this.onSelectFile = onSelectFile;

    this.nodes = {
      wrapper: null,
    };

    this._data = data;

    this.previewer = GLightbox({ loop: true });
    this.draggingImage = null;
  }

  /**
   * CSS classes
   * @constructor
   */
  get CSS() {
    return {
      /**
       * gallery's classes
       */
      baseClass: this.api.styles.block,
      wrapper: "image-tool__gallery_image_gallery",
      mainImagesContainer: "image-tool__gallery_main_images_container",
      mainImages: "image-tool__gallery_main_images",
      miniMap: "image-tool__gallery_minimap",
      miniMapBlock: "image-tool__gallery_minimap_block",

      block: "image-tool__gallery_block",
      image: "image-tool__gallery_block_image",
      toolbar: "image-tool__gallery_block_toolbar",
      toolbarDesc: "image-tool__gallery_block_toolbar__desc",
      toolbarIcon: "image-tool__gallery_block_toolbar__icon",
      toolbarSmallIcon: "image-tool__gallery_block_toolbar__icon_small",

      adderBlock: "image-tool__gallery_block_adder",
      upload: "image-tool__gallery_block_adder_upload",
      hint: "image-tool__gallery_block_adder_hint",
      hintIcon: "image-tool__gallery_block_adder_hint__icon",
      hintText: "image-tool__gallery_block_adder_hint__text",

      //
      descPopover: "image-tool__desc_popover",
      uploadPopover: "image-tool__upload_popover",
      uploadPopoverBtn: "image-tool__upload_popover_btn",
      uploadPopoverInput: "image-tool__upload_popover_textarea",

      //
      imageDragging: "image-dragging",
      imageDrop: "image-drop",
    };
  }

  /**
   * @param {ImageToolData} toolData
   * @return {HTMLDivElement}
   */
  render(data) {
    this._data = data;
    this.nodes.wrapper = make("div", [this.CSS.baseClass, this.CSS.wrapper]);

    const MainImagesContainer = make("div", this.CSS.mainImagesContainer);
    const MainImagesEl = make("div", this.CSS.mainImages);
    const MiniMapEl = this._drawMiniMap();

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const BlockEl = make("div", this.CSS.block);

      BlockEl.addEventListener("click", () => {
        const s1 = this._data.items.slice(0, i);
        const s2 = this._data.items.slice(i, data.items.length);
        // 确保当前打开的在第一张显示
        const sortedItems = [...s2, ...s1];
        const imageElements = sortedItems.map((item) => ({
          href: item.src,
          type: "image",
          description: item.desc || "",
        }));

        this.previewer.setElements(imageElements);
        this.previewer.open();
      });

      const ImageEl = make("img", this.CSS.image, {
        src: item.src,
        "data-gallery-index": item.index,
        alt: "image",
      });

      BlockEl.appendChild(ImageEl);
      BlockEl.appendChild(this._drawInlineToolbar(i, item.desc));

      // hide all popover when leave
      BlockEl.addEventListener("mouseleave", () => hideAll());

      MainImagesEl.appendChild(BlockEl);
    }

    MainImagesEl.appendChild(this._drawAdder());
    MainImagesContainer.appendChild(MainImagesEl);

    this.nodes.wrapper.appendChild(MainImagesContainer);
    this.nodes.wrapper.appendChild(MiniMapEl);

    return this.nodes.wrapper;
  }

  /**
   * draw mini map images for preview
   * mini images can be re-org by dray-drop
   *
   * @memberof Gallery
   * @private
   */
  _drawMiniMap() {
    const MiniMapEl = make("div", this.CSS.miniMap);

    for (let i = 0; i < this._data.items.length; i++) {
      const imageItem = this._data.items[i];
      const ImageEl = make("img", this.CSS.miniMapBlock, {
        src: imageItem.src,
        "data-miniimage-index": i,
        draggable: "true",
      });

      ImageEl.addEventListener("click", () => {
        const MainImage = this.nodes.wrapper.querySelector(
          `[data-gallery-index="${imageItem.index}"]`
        );
        MainImage.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      });

      ImageEl.addEventListener("dragstart", (e) => {
        clazz.add(e.target, this.CSS.imageDragging);
        this.draggingImage = ImageEl;
      });

      ImageEl.addEventListener("dragenter", (e) => {
        if (this.draggingImage !== ImageEl) {
          clazz.add(e.target, this.CSS.imageDrop);
        }
      });

      // if the image is dragging to non-draggable area
      ImageEl.addEventListener("dragend", (e) => {
        clazz.remove(e.target, this.CSS.imageDragging);
      });

      ImageEl.addEventListener("dragover", (e) => {
        if (this.draggingImage !== ImageEl) {
          clazz.add(e.target, this.CSS.imageDrop);
        }
      });

      ImageEl.addEventListener("dragleave", (e) => {
        if (this.draggingImage !== ImageEl) {
          clazz.remove(e.target, this.CSS.imageDrop);
        }
      });

      ImageEl.addEventListener("drop", (e) => {
        clazz.remove(this.draggingImage, this.CSS.imageDragging);
        clazz.remove(e.target, this.CSS.imageDrop);
        const fromIndex = parseInt(this.draggingImage.dataset.miniimageIndex);
        const toIndex = parseInt(e.target.dataset.miniimageIndex);

        swapArrayItems(this._data.items, fromIndex, toIndex);
        this.draggingImage = null;

        this.reRender(this._data);
      });

      MiniMapEl.appendChild(ImageEl);
    }

    return MiniMapEl;
  }

  /**
   * delete picture from current items
   *
   * @param {Number} index - index in _data.items
   * @memberof Gallery
   * @private
   */
  _deletePicture(index) {
    this._data.items = remove(index, 1, this._data.items);
    this.reRender(this._data);
  }

  /**
   * draw inline toolbar for each image
   * @param {number} index
   * @param {desc} desc
   * @return {HTMLElement}
   * @memberof Gallery
   * @private
   */
  _drawInlineToolbar(index, desc) {
    const WrapperEl = make("div", this.CSS.toolbar, {
      "data-toolbar": index,
    });

    const DescEl = make("div", this.CSS.toolbarDesc, {
      innerHTML: desc,
    });

    // 添加说明，更换图片，删除，下载
    const DescIconEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: PenIcon,
    });
    const UploadEl = make("div", this.CSS.toolbarIcon, {
      innerHTML: UploadIcon,
    });
    const DeleteEl = make(
      "div",
      [this.CSS.toolbarIcon, this.CSS.toolbarSmallIcon],
      {
        innerHTML: DeleteIcon,
      }
    );

    DeleteEl.addEventListener("click", (e) => this._deletePicture(index));

    tippy(DescIconEl, this._drawDescOptions(index));
    tippy(UploadEl, this._drawUploadOptions(index));

    this.api.tooltip.onHover(DescIconEl, "添加描述", { delay: 1500 });
    this.api.tooltip.onHover(UploadEl, "重新上传", { delay: 500 });
    this.api.tooltip.onHover(DeleteEl, "删除", { delay: 500 });

    if (!!desc) {
      WrapperEl.appendChild(DescEl);
    }

    WrapperEl.appendChild(DescIconEl);
    WrapperEl.appendChild(UploadEl);
    WrapperEl.appendChild(DeleteEl);

    // avoid trigger previewer the whole picture
    WrapperEl.addEventListener("click", (e) => e.stopPropagation());

    return WrapperEl;
  }

  /**
   * draw picture desc input
   * @param {number} index
   * @return tippy options
   * @memberof Gallery
   */
  _drawDescOptions(index) {
    const WrapperEl = make("div", this.CSS.descPopover);
    const TextareaEl = make("textarea", "", {
      placeholder: "添加描述..",
      value: this._data.items[index].desc || "",
    });

    TextareaEl.addEventListener("input", (e) => {
      this._data.items[index].desc = e.target.value;
    });

    TextareaEl.addEventListener("blur", (e) => {
      const toolbarEl = this.nodes.wrapper.querySelector(
        `[data-toolbar='${index}']`
      );
      toolbarEl.replaceWith(this._drawInlineToolbar(index, e.target.value));
    });

    WrapperEl.appendChild(TextareaEl);

    return {
      content: WrapperEl,
      theme: "light",
      // delay: 200,
      trigger: "click",
      placement: "bottom",
      // allowing you to hover over and click inside them.
      interactive: true,
      onShow() {
        setTimeout(() => TextareaEl.focus());
      },
    };
  }

  /**
   * draw picture upload options input
   * @return tippy options
   * @memberof Gallery
   */
  _drawUploadOptions() {
    const WrapperEl = make("div", this.CSS.uploadPopover);
    const LocalUploadEl = make("div", this.CSS.uploadPopoverBtn, {
      innerHTML: "本地上传",
    });

    const LinkUploadEl = make("div", this.CSS.uploadPopoverBtn, {
      innerHTML: "图片链接",
    });

    const LinkUploadTextareaEl = make("textarea", this.CSS.uploadPopoverInput, {
      placeholder: "链接地址",
    });

    LinkUploadEl.addEventListener("click", (e) => {
      LinkUploadTextareaEl.style.display = "block";
      LinkUploadTextareaEl.focus();
    });

    LinkUploadTextareaEl.addEventListener("blur", (e) => {
      LinkUploadTextareaEl.style.display = "none";
    });

    WrapperEl.appendChild(LocalUploadEl);
    WrapperEl.appendChild(LinkUploadEl);
    WrapperEl.appendChild(LinkUploadTextareaEl);

    return {
      content: WrapperEl,
      theme: "light",
      // delay: 200,
      trigger: "click",
      placement: "bottom",
      // allowing you to hover over and click inside them.
      interactive: true,
    };
  }

  /**
   * draw adder block
   * @return {HTMLElement}
   * @memberof Gallery
   */
  _drawAdder() {
    const AdderEl = make("div", this.CSS.adderBlock);
    const UploadIconEl = make("div", this.CSS.upload, {
      innerHTML: UploadIcon,
    });

    UploadIconEl.addEventListener("click", () => {
      this.onSelectFile();
    });

    const HintEl = make("div", this.CSS.hint);

    const HintIconEl = make("div", this.CSS.hintIcon, {
      innerHTML: LinkAddIcon,
    });

    const HintTextEl = make("div", this.CSS.hintText, {
      innerHTML: "外部链接",
    });

    tippy(
      HintTextEl,
      getExternalLinkPopoverOptions(this._data, -1, (data) =>
        this.reRender(data)
      )
    );

    HintEl.appendChild(HintIconEl);
    HintEl.appendChild(HintTextEl);

    AdderEl.appendChild(UploadIconEl);
    AdderEl.appendChild(HintEl);

    // hide all popover when leave
    AdderEl.addEventListener("mouseleave", () => hideAll());

    return AdderEl;
  }
}
