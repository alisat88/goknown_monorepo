/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import React, { useCallback, useState } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";

import Button from "../Button";
import { Container, ContentButton } from "./styles";

interface IProps {
  url: string;
}

const Pdf: React.FC<React.PropsWithChildren<IProps>> = ({ url }) => {
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
      <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
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
