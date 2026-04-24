import React from "react";
import { FiX } from "react-icons/fi";

import {
  Container,
  ModalContent,
  ModalBody,
  ModalFooter,
  CloseButton,
  EulaText,
} from "./styles";

interface IEulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EulaModal: React.FC<IEulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Container>
      <ModalContent>
        <CloseButton onClick={onClose}>
          <FiX size={24} />
        </CloseButton>

        <ModalBody>
          <h2>Beta Software End User License Agreement (EULA)</h2>
          <p>
            <strong>Effective Date: 4/8/2025</strong>
          </p>

          <EulaText>
            <p>
              <strong>IMPORTANT – READ CAREFULLY:</strong> This Beta Software
              End User License Agreement ("Agreement") is a legal agreement
              between you ("User") and GoKnown, LLC ("Company") for
              participation in the beta testing of DAppGenius ("Software"). By
              installing, accessing, or using the Software, you agree to be
              bound by the terms of this Agreement.
            </p>

            <h3>1. License Grant</h3>
            <p>
              Company grants User a limited, non-exclusive, non-transferable,
              revocable license to use the Software solely for testing and
              evaluation purposes during the beta period.
            </p>

            <h3>2. Restrictions</h3>
            <p>User agrees not to:</p>
            <ul>
              <li>Use the Software for commercial purposes.</li>
              <li>
                Modify, reverse engineer, decompile, or disassemble the
                Software.
              </li>
              <li>
                Distribute, sublicense, or transfer the Software to any third
                party.
              </li>
              <li>
                Disclose any information about the Software without prior
                written consent from the Company.
              </li>
            </ul>

            <h3>3. Confidentiality</h3>
            <p>
              User acknowledges that the Software, including its features,
              design, and functionality, is confidential and proprietary. User
              agrees to keep all information related to the Software
              confidential and not disclose it to any third party.
            </p>

            <h3>4. Feedback</h3>
            <p>
              User agrees to provide feedback regarding the Software's
              performance, usability, and potential improvements. Company may
              use this feedback without restriction or compensation.
            </p>

            <h3>5. No Warranty & Disclaimer</h3>
            <p>
              The Software is provided "AS IS" without any warranties, express
              or implied. Company disclaims all warranties, including but not
              limited to merchantability, fitness for a particular purpose, and
              non-infringement. Company is not responsible for any data loss,
              damage, or disruption caused by the Software.
            </p>

            <h3>6. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Company shall not be
              liable for any direct, indirect, incidental, special, or
              consequential damages arising from the use of the Software, even
              if advised of the possibility of such damages.
            </p>

            <h3>7. Termination</h3>
            <p>
              Company reserves the right to terminate this Agreement at any time
              without notice. Upon termination, User must cease all use of the
              Software and delete any copies.
            </p>

            <h3>8. Governing Law</h3>
            <p>
              This Agreement shall be governed by and construed in accordance
              with the laws of Florida.
            </p>

            <h3>9. Acknowledgment</h3>
            <p>
              By installing or using the Software, User acknowledges that they
              have read, understood, and agreed to the terms of this Agreement.
            </p>

            <div className="company-info">
              <p>
                <strong>GoKnown, LLC</strong>
                <br />
                19195 Mystic Pointe Drive, #303
                <br />
                Aventura, FL 33180
              </p>

              <p>
                <strong>Constance Erlanger, CEO</strong>
                <br />
                cerlanger@goknown.com
                <br />
                Mobile: 203-247-3508
              </p>

              <p>
                <strong>Michael Harold, CTO</strong>
                <br />
                mharold@goknown.com
                <br />
                Mobile: (318) 820-8592
              </p>
            </div>
          </EulaText>
        </ModalBody>

        <ModalFooter>
          <button onClick={onClose}>Close</button>
        </ModalFooter>
      </ModalContent>
    </Container>
  );
};

export default EulaModal;
