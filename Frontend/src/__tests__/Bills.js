/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from '../containers/Bills'

import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import mockStore from '../__mocks__/store'
jest.mock('../app/store', () => mockStore)
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
      window.onNavigate(ROUTES_PATH["Bills"])
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })


  // Test bouton nouvelle note de frais
  describe("When I click on the new bills button", () => {
    test("Then I should be sent on NewBill page", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })

      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      document.body.innerHTML = BillsUI({
        data: bills
      })

      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills,
        localStorage: window.localStorage
      })

      const handleClickNewBill = jest.fn(() => bill.handleClickNewBill())
      const newBillButton = screen.getByText('Nouvelle note de frais')
      newBillButton.addEventListener('click', handleClickNewBill)
      fireEvent.click(newBillButton)
      expect(handleClickNewBill).toHaveBeenCalled()

    })
    // Test bouton icône eye
    describe("when I click on the eye icon", () => {
      test("then a modal should open", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        document.body.innerHTML = BillsUI({ data: bills });

        const bill = new Bills({
          document,
          onNavigate,
          localStorage: window.localStorage,
          store: null,
        });

        $.fn.modal = jest.fn();

        const iconEye = screen.getAllByTestId("icon-eye");
        const handleClickIconEye = jest.fn(bill.handleClickIconEye);

        iconEye.forEach(eye => {
          eye.addEventListener("click", handleClickIconEye(eye));
          fireEvent.click(eye);
          expect(handleClickIconEye).toHaveBeenCalled();
          const modalFile = document.getElementById("modaleFile");
          expect(modalFile).toBeTruthy();
        })
      })

    })
  })
})



// ********************************** Test d'intégration **********************************************
describe('Given I am a user connected as Employee', () => {
  describe('When I navigate to Bills Page', () => {
    test('Then the bills are fetched from the simulated API GET', async () => {
      localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'a@a' })
      )

      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText('Mes notes de frais'))
      const newBillButton = screen.getByText('Nouvelle note de frais')
      expect(newBillButton).toBeTruthy()

      document.body.innerHTML = ''
    })

    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills')
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a',
          })
        )
        const root = document.createElement('div')
        root.setAttribute('id', 'root')
        document.body.appendChild(root)
        router()
      })

      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'))
            },
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
    })

    test('fetches messages from an API and fails with 500 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error('Erreur 500'))
          },
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
