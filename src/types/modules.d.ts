declare namespace jasmine {
  interface Matchers<T> {
    toHaveBeenWarned(): void
    toHaveBeenTipped(): void
  }

  interface ArrayLikeMatchers<T> {
    toHaveBeenWarned(): void
    toHaveBeenTipped(): void
  }
}
