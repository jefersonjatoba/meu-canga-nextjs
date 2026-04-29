import { describe, expect, it } from 'vitest'
import {
  CardEngineError,
  calculateClosingDate,
  calculateDueDate,
  calculateInvoiceSchedule,
  generateInstallments,
  splitCentavos,
} from '@/server/engines/card.engine'

describe('calculateInvoiceSchedule', () => {
  it('coloca compra antes do fechamento na fatura do fechamento atual', () => {
    expect(calculateInvoiceSchedule({
      dataCompra: '2026-04-09',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toEqual({
      competencia: '2026-04',
      dataFechamento: '2026-04-10',
      dataVencimento: '2026-04-20',
    })
  })

  it('coloca compra no dia do fechamento na fatura do fechamento atual', () => {
    expect(calculateInvoiceSchedule({
      dataCompra: '2026-04-10',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toEqual({
      competencia: '2026-04',
      dataFechamento: '2026-04-10',
      dataVencimento: '2026-04-20',
    })
  })

  it('coloca compra depois do fechamento na fatura seguinte', () => {
    expect(calculateInvoiceSchedule({
      dataCompra: '2026-04-11',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toEqual({
      competencia: '2026-05',
      dataFechamento: '2026-05-10',
      dataVencimento: '2026-05-20',
    })
  })

  it('calcula fechamento e vencimento atravessando mes', () => {
    expect(calculateInvoiceSchedule({
      dataCompra: '2026-04-20',
      diaFechamento: 25,
      diaVencimento: 10,
    })).toEqual({
      competencia: '2026-05',
      dataFechamento: '2026-04-25',
      dataVencimento: '2026-05-10',
    })
  })

  it('limita dias 29/30/31 ao ultimo dia valido do mes alvo', () => {
    expect(calculateInvoiceSchedule({
      dataCompra: '2026-02-10',
      diaFechamento: 31,
      diaVencimento: 31,
    })).toEqual({
      competencia: '2026-03',
      dataFechamento: '2026-02-28',
      dataVencimento: '2026-03-31',
    })
  })
})

describe('calculateClosingDate and calculateDueDate', () => {
  it('retorna apenas a data de fechamento', () => {
    expect(calculateClosingDate({
      dataCompra: '2026-04-11',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toBe('2026-05-10')
  })

  it('retorna apenas a data de vencimento', () => {
    expect(calculateDueDate({
      dataCompra: '2026-04-20',
      diaFechamento: 25,
      diaVencimento: 10,
    })).toBe('2026-05-10')
  })
})

describe('generateInstallments', () => {
  it('gera uma parcela', () => {
    expect(generateInstallments({
      valorTotalCentavos: 10000,
      quantidadeParcelas: 1,
      dataCompra: '2026-04-09',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toEqual([
      {
        numero: 1,
        totalParcelas: 1,
        valorCentavos: 10000,
        competencia: '2026-04',
        dataFechamento: '2026-04-10',
        dataVencimento: '2026-04-20',
      },
    ])
  })

  it('gera multiplas parcelas com vencimentos mensais', () => {
    expect(generateInstallments({
      valorTotalCentavos: 30000,
      quantidadeParcelas: 3,
      dataCompra: '2026-04-09',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toEqual([
      expect.objectContaining({ numero: 1, valorCentavos: 10000, competencia: '2026-04' }),
      expect.objectContaining({ numero: 2, valorCentavos: 10000, competencia: '2026-05' }),
      expect.objectContaining({ numero: 3, valorCentavos: 10000, competencia: '2026-06' }),
    ])
  })

  it('gera parcelas atravessando ano', () => {
    const parcelas = generateInstallments({
      valorTotalCentavos: 40000,
      quantidadeParcelas: 4,
      dataCompra: '2026-11-26',
      diaFechamento: 25,
      diaVencimento: 10,
    })

    expect(parcelas.map(p => p.competencia)).toEqual([
      '2027-01',
      '2027-02',
      '2027-03',
      '2027-04',
    ])
    expect(parcelas.map(p => p.dataVencimento)).toEqual([
      '2027-01-10',
      '2027-02-10',
      '2027-03-10',
      '2027-04-10',
    ])
  })

  it('distribui resto de centavos nas primeiras parcelas', () => {
    expect(generateInstallments({
      valorTotalCentavos: 10000,
      quantidadeParcelas: 3,
      dataCompra: '2026-04-09',
      diaFechamento: 10,
      diaVencimento: 20,
    }).map(p => p.valorCentavos)).toEqual([3334, 3333, 3333])
  })
})

describe('splitCentavos', () => {
  it('divide centavos sem perder valor total', () => {
    const parts = splitCentavos(10001, 3)
    expect(parts).toEqual([3334, 3334, 3333])
    expect(parts.reduce((sum, value) => sum + value, 0)).toBe(10001)
  })
})

describe('validations', () => {
  it('rejeita quantidade invalida de parcelas', () => {
    expect(() => generateInstallments({
      valorTotalCentavos: 10000,
      quantidadeParcelas: 0,
      dataCompra: '2026-04-09',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toThrow(CardEngineError)
  })

  it('rejeita valor invalido', () => {
    expect(() => generateInstallments({
      valorTotalCentavos: 0,
      quantidadeParcelas: 1,
      dataCompra: '2026-04-09',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toThrow(CardEngineError)
  })

  it('rejeita dia de fechamento invalido', () => {
    expect(() => calculateInvoiceSchedule({
      dataCompra: '2026-04-09',
      diaFechamento: 32,
      diaVencimento: 20,
    })).toThrow(CardEngineError)
  })

  it('rejeita dia de vencimento invalido', () => {
    expect(() => calculateInvoiceSchedule({
      dataCompra: '2026-04-09',
      diaFechamento: 10,
      diaVencimento: 0,
    })).toThrow(CardEngineError)
  })

  it('rejeita datas invalidas', () => {
    expect(() => calculateInvoiceSchedule({
      dataCompra: '2026-02-31',
      diaFechamento: 10,
      diaVencimento: 20,
    })).toThrow(CardEngineError)
  })
})
