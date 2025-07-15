class ServiceResponse {
  public static success(data: any): any {
    return {
      success: true,
      data,
    };
  }

  public static failure(error: any): any {
    return {
      success: false,
      error,
    };
  }
}

export default ServiceResponse;
