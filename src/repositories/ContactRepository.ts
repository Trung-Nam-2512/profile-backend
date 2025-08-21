import { Contact, IContact } from '../models/Contact'
import { ContactMessage } from '../types/Contact'

export class ContactRepository {
  async create(
    contactData: ContactMessage,
    metadata: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<IContact> {
    const contact = new Contact({
      ...contactData,
      ...metadata,
    })

    return await contact.save()
  }

  async findById(id: string): Promise<IContact | null> {
    return await Contact.findById(id)
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: 'new' | 'read' | 'replied'
  ): Promise<{ contacts: IContact[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit

    const filter = status ? { status } : {}

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Contact.countDocuments(filter),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      contacts,
      total,
      totalPages,
    }
  }

  async updateStatus(
    id: string,
    status: 'new' | 'read' | 'replied'
  ): Promise<IContact | null> {
    return await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Contact.deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  async getStatistics(): Promise<{
    total: number
    new: number
    read: number
    replied: number
    thisMonth: number
  }> {
    const [total, new_, read, replied, thisMonth] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Contact.countDocuments({ status: 'read' }),
      Contact.countDocuments({ status: 'replied' }),
      Contact.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ])

    return {
      total,
      new: new_,
      read,
      replied,
      thisMonth,
    }
  }
}
