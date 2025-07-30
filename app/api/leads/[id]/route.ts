<<<<<<<
import { NextRequest, NextResponse } from 'next/server';



import { createClient } from '@supabase/supabase-js';







const supabase = createClient(



  process.env.NEXT_PUBLIC_SUPABASE_URL!,



  process.env.SUPABASE_SERVICE_ROLE_KEY!



);







export async function GET(



  request: NextRequest,



  { params }: { params: { id: string } }



) {



  try {



    const { data: lead, error } = await supabase



      .from('leads')



      .select('*')



      .eq('id', params.id)



      .single();







    if (error) {



      if (error.code === 'PGRST116') {



        return NextResponse.json(



          { success: false, error: 'Lead not found' },



          { status: 404 }



        );



      }



      throw error;



    }







    return NextResponse.json(lead);







  } catch (error) {



    console.error('Error fetching lead:', error);



    return NextResponse.json(



      {



        success: false,



        error: 'Failed to fetch lead',



        details: error instanceof Error ? error.message : 'Unknown error',



      },



      { status: 500 }



    );



  }



}







export async function PUT(



  request: NextRequest,



  { params }: { params: { id: string } }



) {



  try {



    const body = await request.json();



    



    const { data: lead, error } = await supabase



      .from('leads')



      .update(body)



      .eq('id', params.id)



      .select()



      .single();







    if (error) {



      if (error.code === 'PGRST116') {



        return NextResponse.json(



          { success: false, error: 'Lead not found' },



          { status: 404 }



        );



      }



      throw error;



    }







    return NextResponse.json(lead);







  } catch (error) {



    console.error('Error updating lead:', error);



    return NextResponse.json(



      {



        success: false,



        error: 'Failed to update lead',



        details: error instanceof Error ? error.message : 'Unknown error',



      },



      { status: 500 }



    );



  }



}







export async function DELETE(



  request: NextRequest,



  { params }: { params: { id: string } }



) {



  try {



    const { error } = await supabase



      .from('leads')



      .delete()



      .eq('id', params.id);







    if (error) {



      throw error;



    }







    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });







  } catch (error) {



    console.error('Error deleting lead:', error);



    return NextResponse.json(



      {



        success: false,



        error: 'Failed to delete lead',



        details: error instanceof Error ? error.message : 'Unknown error',



      },



      { status: 500 }



    );



  }



}



=======
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';



const supabase = createClient(

  process.env.NEXT_PUBLIC_SUPABASE_URL!,

  process.env.SUPABASE_SERVICE_ROLE_KEY!

);



export async function GET(

  request: NextRequest,

  { params }: { params: { id: string } }

) {

  try {

    const { data: lead, error } = await supabase

      .from('leads')

      .select('*')

      .eq('id', params.id)

      .single();



    if (error) {

      if (error.code === 'PGRST116') {

        return NextResponse.json(

          { success: false, error: 'Lead not found' },

          { status: 404 }

        );

      }

      throw error;

    }



    return NextResponse.json(lead);



  } catch (error) {

    console.error('Error fetching lead:', error);

    return NextResponse.json(

      {

        success: false,

        error: 'Failed to fetch lead',

        details: error instanceof Error ? error.message : 'Unknown error',

      },

      { status: 500 }

    );

  }

}



export async function PUT(

  request: NextRequest,

  { params }: { params: { id: string } }

) {

  try {

    const body = await request.json();

    

    const { data: lead, error } = await supabase

      .from('leads')

      .update(body)

      .eq('id', params.id)

      .select()

      .single();



    if (error) {

      if (error.code === 'PGRST116') {

        return NextResponse.json(

          { success: false, error: 'Lead not found' },

          { status: 404 }

        );

      }

      throw error;

    }



    return NextResponse.json(lead);



  } catch (error) {

    console.error('Error updating lead:', error);

    return NextResponse.json(

      {

        success: false,

        error: 'Failed to update lead',

        details: error instanceof Error ? error.message : 'Unknown error',

      },

      { status: 500 }

    );

  }

}



export async function DELETE(

  request: NextRequest,

  { params }: { params: { id: string } }

) {

  try {

    const { error } = await supabase

      .from('leads')

      .delete()

      .eq('id', params.id);



    if (error) {

      throw error;

    }



    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });



  } catch (error) {

    console.error('Error deleting lead:', error);

    return NextResponse.json(

      {

        success: false,

        error: 'Failed to delete lead',

        details: error instanceof Error ? error.message : 'Unknown error',

      },

      { status: 500 }

    );

  }

}

>>>>>>>
