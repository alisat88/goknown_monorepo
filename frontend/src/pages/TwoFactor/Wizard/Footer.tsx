/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import Button from "../../../components/Button";

interface IFooterProps {
  lastStep?: boolean;
  firstStep?: boolean;
  handleNext(): void;
  handlePrevious(): void;
}

export function Footer({
  handleNext,
  handlePrevious,
  lastStep = false,
  firstStep = false,
}: IFooterProps) {
  return (
    <footer>
      {!firstStep ? (
        <Button onClick={handlePrevious}>Previous</Button>
      ) : (
        <div></div>
      )}
      {!lastStep && <Button onClick={handleNext}>Next</Button>}
    </footer>
  );
}
