const classes = [
  {
    day: "Monday",
    activity: "HIIT Training",
    time: "18:00",
  },
  {
    day: "Tuesday",
    activity: "Padel",
    time: "19:00",
  },
  {
    day: "Wednesday",
    activity: "Fitness",
    time: "18:30",
  },
  {
    day: "Thursday",
    activity: "Yoga",
    time: "17:30",
  },
];

export default function CalendarPreview() {
  return (
    <section className="bg-slate-50 dark:bg-neutral-950 py-24 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            Weekly Schedule
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {classes.map((item) => (
            <div
              key={item.day}
              className="
                rounded-3xl 
                bg-white 
                dark:bg-neutral-900 
                p-8 
                shadow-sm 
                dark:shadow-none 
                border 
                border-transparent 
                dark:border-neutral-800/60
                transition-all 
                duration-300
              "
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {item.day}
              </h3>

              <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 transition-colors duration-300">
                {item.activity}
              </p>

              {/* Le badge conserve sa couleur jaune tout en restant intégré au thème */}
              <span className="mt-3 inline-block rounded-full bg-[#D8E219] px-4 py-1.5 text-sm font-bold text-black shadow-sm">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}