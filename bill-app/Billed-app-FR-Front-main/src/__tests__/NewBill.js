/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { fireEvent, waitFor } from "@testing-library/dom";
import mockedStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";



describe("Given I am connected as an employee", () => {
  //////////////////////////////////////////////
  //Set up for all tests
  describe("When I am on NewBill Page", () => {
    // Set email to local storage before each test
      beforeEach(() => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employé",
            email: "employé@emailBill.com",
          })
        );
      });
      //Reset after each test
      afterEach(() => {
        window.localStorage.clear();
      });


    //Is form rendered ? (i added the expect)
    test("Then the form should render correctly", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

//////////////////////////////////////////////////////////// 
////Use txt file to check if non-image files really can't be uploaded
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

//////////////////////////////////////////////////////////// 
////Check img file name
    test("Then the image files should be uploaded correctly", () => {
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
      const file = new File(["image file content"], "test.png", {
        type: "image/png",
      });

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      expect(fileInput.files[0].name).toBe("test.png");
    });

//////////////////////////////////////////////////////////// 
////Error should be caught and logged if file upload fails
    test("Then an error should be caught and logged if file upload fails", async () => {
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
      const file = new File(["image content"], "image.png", {
        type: "image/png",
      });
    
      // Force file upload to fail
      const createSpy = jest.spyOn(newBill.store, "bills").mockImplementation(() => ({
        create: () => Promise.reject(new Error("File upload failed")),
      }));
    
      //Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    
      //Wait for file upload to fail
      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    
      //Check if error is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(new Error("File upload failed"));
    
      //Reinitialise spies
      createSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
    
//////////////////////////////////////////////////////////// 
////Form values should be sent as expected when submitting
    test("Then the form should submit with correct values", () => {
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
    
      const form = screen.getByTestId("form-new-bill");
      const dateInput = screen.getByTestId("datepicker");
      const typeInput = screen.getByTestId("expense-type");
      const nameInput = screen.getByTestId("expense-name");
      const amountInput = screen.getByTestId("amount");
      const vatInput = screen.getByTestId("vat");
      const pctInput = screen.getByTestId("pct");
      const commentaryInput = screen.getByTestId("commentary");
    
      fireEvent.input(dateInput, { target: { value: "2013-01-02" } });
      userEvent.selectOptions(typeInput, "Restaurants et bars");
      fireEvent.input(nameInput, { target: { value: "Le bistro du coin" } });
      fireEvent.input(amountInput, { target: { value: 150 } });
      fireEvent.input(vatInput, { target: { value: "20" } });
      fireEvent.input(pctInput, { target: { value: 10 } });
      fireEvent.input(commentaryInput, {
        target: { value: "Repas d'affaire" },
      });
    
      // Mock the updateBill function to prevent navigating away from the page
      newBill.updateBill = jest.fn();
    
      fireEvent.submit(form);
      expect(newBill.updateBill).toHaveBeenCalledWith({
        email: JSON.parse(localStorageMock.getItem("user")).email,
        type: "Restaurants et bars",
        name: "Le bistro du coin",
        amount: 150,
        date: "2013-01-02",
        vat: "20",
        pct: 10,
        commentary: "Repas d'affaire",
        fileUrl: null,
        fileName: null,
        status: "pending",
      });
    });

  });
})    