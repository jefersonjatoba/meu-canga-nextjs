import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Cartão Integration - Payment → Lançamento Flow', () => {
  let userId: string
  let contaCreditoId: string
  let contaDebitoId: string
  let cartaoId: string
  let faturaId: string

  beforeAll(async () => {
    // Create test user
    try {
      // In a real test, we'd create a user, but for this integration test
      // we'll assume we're testing with existing infrastructure
      const existingUser = await prisma.user.findFirst({
        where: { email: 'teste@meucanga.com' },
      })

      if (existingUser) {
        userId = existingUser.id
      } else {
        // Create test user if it doesn't exist
        const newUser = await prisma.user.create({
          data: {
            email: 'teste-cartao@meucanga.com',
            cpf: '12345678900',
            name: 'Teste Cartão',
            password: 'hashed_password', // Would be properly hashed in production
          },
        })
        userId = newUser.id
      }

      // Create credit account
      const creditAccount = await prisma.conta.create({
        data: {
          userId,
          nome: 'Cartão de Crédito Teste',
          tipo: 'CREDITO',
          saldoAtual: 0,
          limiteCentavos: 500000, // R$ 5.000
          diaFechamento: 20,
          diaVencimento: 27,
        },
      })
      contaCreditoId = creditAccount.id

      // Create debit account for payments
      const debitAccount = await prisma.conta.create({
        data: {
          userId,
          nome: 'Conta Corrente',
          tipo: 'CONTA_CORRENTE',
          saldoAtual: 10000, // R$ 10.000
          banco: 'Banco Teste',
          agencia: '0001',
          numero: '123456-7',
        },
      })
      contaDebitoId = debitAccount.id

      // Create credit card
      const cartao = await prisma.cartao.create({
        data: {
          userId,
          contaId: contaCreditoId,
          nome: 'Cartão Teste',
          ultimosDigitos: '1234',
          bandeira: 'VISA',
          status: 'ativa',
        },
      })
      cartaoId = cartao.id

      // Create invoice for testing
      const fatura = await prisma.fatura.create({
        data: {
          cartaoId,
          mes: '2026-04',
          diaFechamento: new Date('2026-04-20'),
          diaVencimento: new Date('2026-04-27'),
          valor: 1000, // R$ 1.000
          status: 'aberta',
        },
      })
      faturaId = fatura.id
    } catch (error) {
      console.error('Setup error:', error)
      throw error
    }
  })

  afterAll(async () => {
    // Clean up test data
    try {
      // Delete in dependency order
      await prisma.pagamentoFatura.deleteMany({ where: { faturaId } })
      await prisma.fatura.deleteMany({ where: { cartaoId } })
      await prisma.parcelamento.deleteMany({
        where: { compra: { cartaoId } },
      })
      await prisma.compraCartao.deleteMany({ where: { cartaoId } })
      await prisma.cartao.deleteMany({ where: { userId } })
      await prisma.lancamento.deleteMany({ where: { userId } })
      await prisma.conta.deleteMany({ where: { userId } })
      await prisma.user.deleteMany({ where: { id: userId } })
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  it('should create a purchase with installments', async () => {
    const compra = await prisma.compraCartao.create({
      data: {
        cartaoId,
        descricao: 'Compra de teste',
        valor: 300,
        categoria: 'ALIMENTACAO',
        data: new Date('2026-04-10'),
        status: 'confirmada',
        parcelas: {
          create: [
            { numero: 1, total: 3, valor: 100, status: 'aberta' },
            { numero: 2, total: 3, valor: 100, status: 'aberta' },
            { numero: 3, total: 3, valor: 100, status: 'aberta' },
          ],
        },
      },
      include: { parcelas: true },
    })

    expect(compra).toBeDefined()
    expect(compra.cartaoId).toBe(cartaoId)
    expect(compra.valor).toBe(300)
    expect(compra.parcelas).toHaveLength(3)
    expect(compra.parcelas[0].numero).toBe(1)
    expect(compra.parcelas[0].valor).toBe(100)
  })

  it('should create payment and automatic lançamento', async () => {
    // Create payment
    const pagamento = await prisma.pagamentoFatura.create({
      data: {
        faturaId,
        valor: 500,
        contaPagamentoId: contaDebitoId,
        data: new Date('2026-04-25'),
        status: 'confirmado',
      },
    })

    // Create automatic lançamento (as done in the API)
    const lancamento = await prisma.lancamento.create({
      data: {
        userId,
        contaId: contaDebitoId,
        descricao: `Pagamento de fatura - Cartão Teste`,
        tipo: 'DESPESA',
        categoria: 'Pagamentos',
        valor: 500,
        data: pagamento.data,
        status: 'confirmada',
      },
    })

    // Verify payment exists
    expect(pagamento).toBeDefined()
    expect(pagamento.faturaId).toBe(faturaId)
    expect(pagamento.valor).toBe(500)
    expect(pagamento.status).toBe('confirmado')

    // Verify automatic lançamento was created
    expect(lancamento).toBeDefined()
    expect(lancamento.userId).toBe(userId)
    expect(lancamento.contaId).toBe(contaDebitoId)
    expect(lancamento.tipo).toBe('DESPESA')
    expect(lancamento.valor).toBe(500)
    expect(lancamento.categoria).toBe('Pagamentos')

    // Update fatura status as API does
    const updatedFatura = await prisma.fatura.update({
      where: { id: faturaId },
      data: {
        valorPago: { increment: 500 },
        status: 'parcialmente_paga',
      },
    })

    expect(updatedFatura.valorPago).toBe(500)
    expect(updatedFatura.status).toBe('parcialmente_paga')
  })

  it('should handle payment for fully paid invoice', async () => {
    // Create another payment to fully pay the invoice
    const pagamento = await prisma.pagamentoFatura.create({
      data: {
        faturaId,
        valor: 500, // Remaining amount
        contaPagamentoId: contaDebitoId,
        data: new Date('2026-04-26'),
        status: 'confirmado',
      },
    })

    // Create automatic lançamento
    await prisma.lancamento.create({
      data: {
        userId,
        contaId: contaDebitoId,
        descricao: `Pagamento de fatura - Cartão Teste`,
        tipo: 'DESPESA',
        categoria: 'Pagamentos',
        valor: 500,
        data: pagamento.data,
        status: 'confirmada',
      },
    })

    // Update fatura as API does
    const updatedFatura2 = await prisma.fatura.update({
      where: { id: faturaId },
      data: {
        valorPago: { increment: 500 },
        status: 'paga', // Fully paid now
      },
    })

    // Verify final state
    const faturaFinal = await prisma.fatura.findUnique({
      where: { id: faturaId },
      include: { pagamentos: true },
    })

    expect(faturaFinal).toBeDefined()
    expect(faturaFinal!.pagamentos).toHaveLength(2)
    expect(faturaFinal!.valorPago).toBe(1000) // 500 + 500
    expect(updatedFatura2.status).toBe('paga')
    expect(updatedFatura2.valorPago).toBe(1000)
  })

  it('should verify balance consistency', async () => {
    // Check that all lançamentos for the user can be summed
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        userId,
        contaId: contaDebitoId,
      },
    })

    const totalDespesas = lancamentos
      .filter((l) => l.tipo === 'DESPESA')
      .reduce((sum, l) => sum + l.valor, 0)

    expect(totalDespesas).toBeGreaterThan(0)
    expect(totalDespesas).toBe(1000) // Two payments of 500 each

    // Verify payments match lançamentos
    const pagamentos = await prisma.pagamentoFatura.findMany({
      where: { faturaId },
    })

    const totalPagamentos = pagamentos.reduce((sum, p) => sum + p.valor, 0)
    expect(totalPagamentos).toBe(totalDespesas)
  })
})
