import { describe, expect, it } from 'vitest'

import {
  InvestmentEngineError,
  aplicarCompra,
  aplicarVenda,
  calcularPosicao,
  calcularResumo,
  type InvestmentPosition,
} from '@/server/engines/investment.engine'

describe('investment.engine', () => {
  describe('calcularPosicao', () => {
    it('calcula compra unica', () => {
      const position = calcularPosicao([
        { tipo: 'compra', quantidadeDecimal: '10', valorTotalCentavos: 10000 },
      ])

      expect(position).toEqual({
        quantidadeAtual: '10',
        custoTotalCentavos: 10000,
        precoMedioCentavos: 1000,
      })
    })

    it('calcula multiplas compras com preco medio ponderado', () => {
      const position = calcularPosicao([
        { tipo: 'compra', quantidadeDecimal: '10', valorTotalCentavos: 10000 },
        { tipo: 'compra', quantidadeDecimal: '5', valorTotalCentavos: 7500 },
      ])

      expect(position).toEqual({
        quantidadeAtual: '15',
        custoTotalCentavos: 17500,
        precoMedioCentavos: 1167,
      })
    })

    it('ignora operacoes canceladas', () => {
      const position = calcularPosicao([
        { tipo: 'compra', quantidadeDecimal: '10', valorTotalCentavos: 10000 },
        {
          tipo: 'compra',
          quantidadeDecimal: '10',
          valorTotalCentavos: 50000,
          status: 'cancelada',
        },
      ])

      expect(position).toEqual({
        quantidadeAtual: '10',
        custoTotalCentavos: 10000,
        precoMedioCentavos: 1000,
      })
    })

    it('inclui taxas no custo de compra', () => {
      const position = calcularPosicao([
        {
          tipo: 'compra',
          quantidadeDecimal: '10',
          valorTotalCentavos: 10000,
          taxasCentavos: 50,
        },
      ])

      expect(position).toEqual({
        quantidadeAtual: '10',
        custoTotalCentavos: 10050,
        precoMedioCentavos: 1005,
      })
    })
  })

  describe('aplicarCompra', () => {
    it('aceita quantidade decimal com parser seguro', () => {
      const position = aplicarCompra(emptyPosition(), {
        tipo: 'compra',
        quantidadeDecimal: '1,5',
        valorTotalCentavos: 1500,
      })

      expect(position).toEqual({
        quantidadeAtual: '1.5',
        custoTotalCentavos: 1500,
        precoMedioCentavos: 1000,
      })
    })
  })

  describe('aplicarVenda', () => {
    const initialPosition: InvestmentPosition = {
      quantidadeAtual: '10',
      custoTotalCentavos: 10000,
      precoMedioCentavos: 1000,
    }

    it('aplica venda parcial e calcula resultado realizado', () => {
      const position = aplicarVenda(initialPosition, {
        tipo: 'venda',
        quantidadeDecimal: '4',
        valorTotalCentavos: 6000,
      })

      expect(position).toEqual({
        quantidadeAtual: '6',
        custoTotalCentavos: 6000,
        precoMedioCentavos: 1000,
        custoBaixadoCentavos: 4000,
        resultadoRealizadoCentavos: 2000,
      })
    })

    it('aplica venda total e zera custo/preco medio', () => {
      const position = aplicarVenda(initialPosition, {
        tipo: 'venda',
        quantidadeDecimal: '10',
        valorTotalCentavos: 12000,
        taxasCentavos: 100,
      })

      expect(position).toEqual({
        quantidadeAtual: '0',
        custoTotalCentavos: 0,
        precoMedioCentavos: 0,
        custoBaixadoCentavos: 10000,
        resultadoRealizadoCentavos: 1900,
      })
    })

    it('rejeita venda maior que a posicao atual', () => {
      expect(() => aplicarVenda(initialPosition, {
        tipo: 'venda',
        quantidadeDecimal: '11',
        valorTotalCentavos: 11000,
      })).toThrow(InvestmentEngineError)
    })
  })

  describe('calcularResumo', () => {
    it('calcula valor atual, resultado nao realizado e rentabilidade', () => {
      const summary = calcularResumo([
        { tipo: 'compra', quantidadeDecimal: '10', valorTotalCentavos: 10000 },
      ], 1500)

      expect(summary).toEqual({
        quantidadeAtual: '10',
        custoTotalCentavos: 10000,
        precoMedioCentavos: 1000,
        valorAtualCentavos: 15000,
        resultadoNaoRealizadoCentavos: 5000,
        rentabilidadePercentual: 50,
      })
    })
  })
})

function emptyPosition(): InvestmentPosition {
  return {
    quantidadeAtual: '0',
    custoTotalCentavos: 0,
    precoMedioCentavos: 0,
  }
}
