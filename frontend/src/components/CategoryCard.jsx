import React from 'react'

function CategoryCard({ name, image, onClick }) {
  return (
    <div className='w-[110px] h-[110px] md:w-[160px] md:h-[160px] rounded-full border-[3px] border-transparent hover:border-[#e23744] shrink-0 overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 relative group cursor-pointer' onClick={onClick}>
      <img src={image} alt={name} className='w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500' />
      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300'></div>
      <div className='absolute bottom-0 w-full left-0 px-2 py-3 text-center'>
        <span className='text-sm md:text-base font-bold text-white tracking-wide drop-shadow-md'>{name}</span>
      </div>
    </div>
  )
}

export default CategoryCard
