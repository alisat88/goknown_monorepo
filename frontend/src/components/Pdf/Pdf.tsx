import React, { useCallback, useState } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";

import Button from "../Button";
import { Container, ContentButton } from "./styles";

interface IProps {
  url: string;
  onReady?(): void;
  onViewerError?(): void;
}

const Pdf: React.FC<React.PropsWithChildren<IProps>> = ({
  url,
  onReady,
  onViewerError,
}) => {
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);

  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

  const onDocumentLoadSuccess = useCallback(({ numPages }: any) => {
    setNumPages(numPages);
  }, []);

  const nextPage = useCallback(() => {
    // if(pageNumber >= numPages) {
    setPageNumber(pageNumber + 1);
    // }
  }, [pageNumber]);

  const prevPage = useCallback(() => {
    // if(pageNumber >= numPages) {
    setPageNumber(pageNumber - 1);
    // }
  }, [pageNumber]);

  return (
    <Container>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onViewerError}
      >
        <Page
          pageNumber={pageNumber}
          onRenderSuccess={onReady}
          onRenderError={onViewerError}
        />
      </Document>
      <ContentButton>
        <Button disabled={pageNumber === 1} onClick={() => prevPage()}>
          {"<"}
        </Button>
        <Button disabled={pageNumber >= numPages} onClick={() => nextPage()}>
          {">"}
        </Button>
      </ContentButton>
    </Container>
  );
};

export default Pdf;
