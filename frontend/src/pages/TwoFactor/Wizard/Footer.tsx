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
