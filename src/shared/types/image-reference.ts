export type ImageReference =
  | {
      type: 'url';
      url: string;
    }
  | {
      type: 'file';
      fileId: string;
    };
