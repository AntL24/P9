/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { fireEvent } from "@testing-library/dom";
import mockedStore from "../__mocks__/store.js";



describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    //Add expect to check if the form is rendered
    test("Then the form should render correctly", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });
    //Use txt file to check if non-image files really can't be uploaded
    test("Then the file input should not accept non-image files", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname];
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: localStorageMock,
      });

      const fileInput = screen.getByTestId("file");
      const file = new File(["text file content"], "test.txt", {
        type: "text/plain",
      });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      expect(fileInput.value).toBe("");
    });
  })
})
