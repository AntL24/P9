/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import mockBills from "../__mocks__/store.js";
import NewBillUI from "../views/NewBillUI.js";
import Bills from "../containers/Bills.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //Expect expression to check if the window icon is highlighted
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()

    })
    
    test("Then bills should be ordered from earliest to latest", () => {
      //Use same method as in container/ Bills.js to get bills and sort them so as to make sure they are ordered from earliest to latest
      document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    //Verify that user can navigate to new bill page when clicking on corresponding button
    test("When I click on new bill button, I should be redirected to new bill page", () => {
      document.body.innerHTML = BillsUI({ data: bills })
    
      const onNavigate = jest.fn();
      new Bills({ document, onNavigate, store: mockBills, localStorage: localStorageMock })
    
      const newBillButton = screen.getByTestId('btn-new-bill');
      fireEvent.click(newBillButton);
    
      // Check if onNavigate function was called with route: NewBill
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
    })
      describe("When I click on the eye icon", () => {
        test("Then a modal should display the bill image", () => {
          const html = BillsUI({ data: bills });
          document.body.innerHTML = html;
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES_PATH[pathname];
          };
          const bill = new Bills({ document, onNavigate, store: mockBills, localStorage: window.localStorage });
        
          const mockIcon = document.createElement("div");
          const fakeImageUrl = "https://fake-image-url.com/image.png";
          mockIcon.setAttribute("data-bill-url", fakeImageUrl);
        
          // Mock the jQuery modal method to avoid error when calling the test
          $.fn.modal = jest.fn();
        
          bill.handleClickIconEye(mockIcon);
        
          expect(screen.getByAltText("Bill").src).toBe(fakeImageUrl);
          expect($.fn.modal).toHaveBeenCalledWith('show');
        });
        
      });
    
      
  })
})
